import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { OtaRolloutEngine } from './ota-rollout.engine';
import { OtaMqttHandler } from './ota-mqtt.handler';
import { CreateCampaignDto, OtaDeployDto, OtaRollbackDto, OtaQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper, OtaCampaignStatus, OtaStatus } from '@app/common';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class OtaService {
  private readonly logger = new Logger(OtaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly otaRolloutEngine: OtaRolloutEngine,
    private readonly otaMqttHandler: OtaMqttHandler,
  ) {}

  async createCampaign(dto: CreateCampaignDto, userId?: string): Promise<ApiResponseInterface> {
    const firmware = await this.prisma.firmware.findUnique({
      where: { id: dto.firmwareId },
    });

    if (!firmware) {
      throw new NotFoundException(`Firmware with ID ${dto.firmwareId} not found`);
    }

    const campaign = await this.prisma.otaCampaign.create({
      data: {
        firmwareId: dto.firmwareId,
        campaignName: dto.campaignName,
        rolloutType: dto.rolloutType,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        status: dto.scheduledAt ? OtaCampaignStatus.SCHEDULED : OtaCampaignStatus.DRAFT,
        createdBy: userId,
      },
    });

    this.logger.log(`Created OTA Campaign [${campaign.campaignName}] (ID: ${campaign.id})`);
    return ResponseHelper.success(campaign, 'OTA Campaign created successfully', 201);
  }

  async deployCampaign(dto: OtaDeployDto): Promise<ApiResponseInterface> {
    const campaign = await this.prisma.otaCampaign.findUnique({
      where: { id: dto.campaignId },
      include: { firmware: true },
    });

    if (!campaign) {
      throw new NotFoundException(`OTA Campaign with ID ${dto.campaignId} not found`);
    }

    let targetVehicleIds: string[] = [];

    if (dto.vehicleIds && dto.vehicleIds.length > 0) {
      targetVehicleIds = dto.vehicleIds;
    } else if (dto.fleetId) {
      const vehicles = await this.prisma.vehicle.findMany({
        where: { fleetId: dto.fleetId },
        select: { id: true },
      });
      targetVehicleIds = vehicles.map((v) => v.id);
    } else {
      const vehicles = await this.prisma.vehicle.findMany({
        select: { id: true },
        take: 100,
      });
      targetVehicleIds = vehicles.map((v) => v.id);
    }

    if (targetVehicleIds.length === 0) {
      throw new BadRequestException('No target vehicles found for OTA deployment');
    }

    // Initialize campaign deployment in rollout engine
    await this.otaRolloutEngine.deployCampaign(dto.campaignId, targetVehicleIds);

    // Send MQTT Manifest to vehicles
    for (const vehId of targetVehicleIds) {
      await this.otaMqttHandler.sendOtaManifest(vehId, {
        campaignId: dto.campaignId,
        firmwareVersion: campaign.firmware.version,
        checksum: campaign.firmware.checksum,
        releaseNotes: campaign.firmware.releaseNotes,
        timestamp: new Date().toISOString(),
      });
    }

    await this.kafkaProducer.emit(KAFKA_TOPICS.OTA_STARTED, {
      campaignId: dto.campaignId,
      totalVehicles: targetVehicleIds.length,
      startedAt: new Date().toISOString(),
    });

    return ResponseHelper.success(
      { campaignId: dto.campaignId, totalVehicles: targetVehicleIds.length },
      `OTA update deployment started for ${targetVehicleIds.length} vehicles`,
    );
  }

  async rollbackVehicle(dto: OtaRollbackDto): Promise<ApiResponseInterface> {
    await this.otaRolloutEngine.executeRollback(dto.vehicleId, dto.targetVersion);
    return ResponseHelper.success(
      { vehicleId: dto.vehicleId, rolledBackToVersion: dto.targetVersion },
      `Firmware rollback initiated for vehicle ${dto.vehicleId}`,
    );
  }

  async findAllCampaigns(query: OtaQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [campaigns, totalItems] = await Promise.all([
      this.prisma.otaCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { firmware: true },
      }),
      this.prisma.otaCampaign.count({ where }),
    ]);

    const formatted = campaigns.map((c) => ({
      ...c,
      firmware: {
        ...c.firmware,
        size: c.firmware.size.toString(),
      },
    }));

    return ResponseHelper.success(formatted, 'OTA Campaigns fetched successfully', 200, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }

  async findCampaignById(id: string): Promise<ApiResponseInterface> {
    const campaign = await this.prisma.otaCampaign.findUnique({
      where: { id },
      include: {
        firmware: true,
        deployments: {
          take: 50,
          include: { vehicle: { select: { vin: true, registrationNumber: true } } },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`OTA Campaign with ID ${id} not found`);
    }

    const formatted = {
      ...campaign,
      firmware: {
        ...campaign.firmware,
        size: campaign.firmware.size.toString(),
      },
    };

    return ResponseHelper.success(formatted);
  }

  async getOtaHistory(): Promise<ApiResponseInterface> {
    const deployments = await this.prisma.otaDeployment.findMany({
      orderBy: { startedAt: 'desc' },
      take: 100,
      include: { vehicle: { select: { vin: true, registrationNumber: true } } },
    });
    return ResponseHelper.success(deployments);
  }

  async getOtaStatistics(): Promise<ApiResponseInterface> {
    const [totalDeployments, completed, failed, inProgress] = await Promise.all([
      this.prisma.otaDeployment.count(),
      this.prisma.otaDeployment.count({ where: { deploymentStatus: OtaStatus.COMPLETED } }),
      this.prisma.otaDeployment.count({ where: { deploymentStatus: OtaStatus.FAILED } }),
      this.prisma.otaDeployment.count({
        where: {
          deploymentStatus: {
            in: [OtaStatus.DOWNLOADING, OtaStatus.INSTALLING, OtaStatus.REBOOTING],
          },
        },
      }),
    ]);

    const successRate =
      totalDeployments > 0 ? Number(((completed / totalDeployments) * 100).toFixed(2)) : 100.0;

    return ResponseHelper.success({
      totalDeployments,
      completed,
      failed,
      inProgress,
      successRatePercentage: successRate,
    });
  }
}
