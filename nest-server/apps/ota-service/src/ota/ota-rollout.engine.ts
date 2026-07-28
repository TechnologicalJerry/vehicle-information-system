import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { OtaStatus, OtaCampaignStatus } from '@app/common';
import { KAFKA_TOPICS, OtaEventPayload } from '@app/events';

@Injectable()
export class OtaRolloutEngine {
  private readonly logger = new Logger(OtaRolloutEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async deployCampaign(campaignId: string, vehicleIds: string[]): Promise<void> {
    const campaign = await this.prisma.otaCampaign.findUnique({
      where: { id: campaignId },
      include: { firmware: true },
    });

    if (!campaign) {
      throw new BadRequestException(`OTA Campaign with ID ${campaignId} not found`);
    }

    // Update campaign status to ACTIVE
    await this.prisma.otaCampaign.update({
      where: { id: campaignId },
      data: {
        status: OtaCampaignStatus.ACTIVE,
        totalVehicles: vehicleIds.length,
      },
    });

    for (const vehicleId of vehicleIds) {
      await this.prisma.otaDeployment.create({
        data: {
          campaignId,
          vehicleId,
          firmwareVersion: campaign.firmware.version,
          deploymentStatus: OtaStatus.PENDING,
        },
      });

      this.logger.log(`Created OTA Deployment for vehicle [${vehicleId}] (Campaign ${campaignId})`);
    }
  }

  async updateDeploymentStatus(
    deploymentId: string,
    status: OtaStatus,
    failureReason?: string,
  ): Promise<void> {
    const deployment = await this.prisma.otaDeployment.findUnique({
      where: { id: deploymentId },
      include: { campaign: true },
    });

    if (!deployment) return;

    const now = new Date();
    const updated = await this.prisma.otaDeployment.update({
      where: { id: deploymentId },
      data: {
        deploymentStatus: status,
        startedAt: status === OtaStatus.DOWNLOADING ? now : undefined,
        completedAt: status === OtaStatus.COMPLETED ? now : undefined,
        failureReason,
      },
    });

    if (status === OtaStatus.COMPLETED) {
      await this.prisma.otaCampaign.update({
        where: { id: deployment.campaignId },
        data: { successfulUpdates: { increment: 1 } },
      });
      // Update vehicle software version in DB
      await this.prisma.vehicle.update({
        where: { id: deployment.vehicleId },
        data: { firmwareVersion: deployment.firmwareVersion },
      });

      await this.emitKafka(KAFKA_TOPICS.FIRMWARE_INSTALLED, updated);
      await this.emitKafka(KAFKA_TOPICS.OTA_COMPLETED, updated);
    } else if (status === OtaStatus.FAILED) {
      await this.prisma.otaCampaign.update({
        where: { id: deployment.campaignId },
        data: { failedUpdates: { increment: 1 } },
      });
      await this.emitKafka(KAFKA_TOPICS.OTA_FAILED, updated);
    }

    this.logger.log(`OTA Deployment [${deploymentId}] status updated to ${status}`);
  }

  async executeRollback(vehicleId: string, targetVersion: string): Promise<void> {
    this.logger.warn(
      `Executing automatic firmware rollback for vehicle [${vehicleId}] to version [${targetVersion}]`,
    );
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { firmwareVersion: targetVersion },
    });
  }

  private async emitKafka(topic: string, deployment: any): Promise<void> {
    const payload: OtaEventPayload = {
      campaignId: deployment.campaignId,
      vehicleId: deployment.vehicleId,
      firmwareVersion: deployment.firmwareVersion,
      status: deployment.deploymentStatus,
      timestamp: new Date().toISOString(),
      failureReason: deployment.failureReason,
    };
    await this.kafkaProducer.emit(topic, payload);
  }
}
