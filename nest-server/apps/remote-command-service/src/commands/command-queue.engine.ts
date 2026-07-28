import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { CommandStatus, COMMAND_CONSTANTS } from '@app/common';
import { KAFKA_TOPICS, RemoteCommandEventPayload } from '@app/events';

@Injectable()
export class CommandQueueEngine {
  private readonly logger = new Logger(CommandQueueEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async enqueueCommand(commandId: string): Promise<void> {
    const command = await this.prisma.remoteCommand.findUnique({
      where: { id: commandId },
    });

    if (!command) {
      throw new BadRequestException(`Command with ID ${commandId} not found`);
    }

    if (command.status !== CommandStatus.PENDING) {
      throw new BadRequestException(
        `Cannot enqueue command ${commandId} in status ${command.status}`,
      );
    }

    // Update status to QUEUED
    await this.prisma.remoteCommand.update({
      where: { id: commandId },
      data: { status: CommandStatus.QUEUED },
    });

    // Store in Redis priority queue / cache
    const queueKey = `command:pending:${command.vehicleId}`;
    await this.redisService.set(
      queueKey,
      command,
      COMMAND_CONSTANTS.DEFAULT_COMMAND_TIMEOUT_SECONDS,
    );

    this.logger.log(
      `Command [${command.commandType}] (ID: ${commandId}, Correlation: ${command.correlationId}) queued for vehicle [${command.vehicleId}]`,
    );
  }

  async markSent(commandId: string): Promise<void> {
    const updated = await this.prisma.remoteCommand.update({
      where: { id: commandId },
      data: {
        status: CommandStatus.SENT,
        sentAt: new Date(),
        timeoutAt: new Date(Date.now() + COMMAND_CONSTANTS.DEFAULT_COMMAND_TIMEOUT_SECONDS * 1000),
      },
    });

    await this.emitKafkaEvent(KAFKA_TOPICS.COMMAND_SENT, updated);
  }

  async handleAck(
    correlationId: string,
    status: 'ACKNOWLEDGED' | 'COMPLETED' | 'FAILED',
    errorMessage?: string,
  ): Promise<void> {
    const command = await this.prisma.remoteCommand.findUnique({
      where: { correlationId },
    });

    if (!command) {
      this.logger.warn(`Received ACK for unknown correlationId [${correlationId}]`);
      return;
    }

    const now = new Date();
    let newStatus: CommandStatus = CommandStatus.ACKNOWLEDGED;
    let kafkaTopic = KAFKA_TOPICS.COMMAND_ACKNOWLEDGED;

    if (status === 'COMPLETED') {
      newStatus = CommandStatus.COMPLETED;
      kafkaTopic = KAFKA_TOPICS.COMMAND_COMPLETED;
    } else if (status === 'FAILED') {
      newStatus = CommandStatus.FAILED;
      kafkaTopic = KAFKA_TOPICS.COMMAND_FAILED;
    }

    const updated = await this.prisma.remoteCommand.update({
      where: { id: command.id },
      data: {
        status: newStatus,
        acknowledgedAt: now,
        completedAt: status === 'COMPLETED' ? now : undefined,
        failedAt: status === 'FAILED' ? now : undefined,
        errorMessage,
      },
    });

    // Remove from pending Redis cache
    await this.redisService.del(`command:pending:${command.vehicleId}`);
    await this.emitKafkaEvent(kafkaTopic, updated);

    this.logger.log(
      `Command [${command.id}] correlation [${correlationId}] transitioned to ${newStatus}`,
    );
  }

  async handleTimeout(commandId: string): Promise<void> {
    const command = await this.prisma.remoteCommand.findUnique({
      where: { id: commandId },
    });

    if (
      !command ||
      command.status === CommandStatus.COMPLETED ||
      command.status === CommandStatus.FAILED
    ) {
      return;
    }

    if (command.retryCount < COMMAND_CONSTANTS.MAX_COMMAND_RETRIES) {
      // Retry with exponential backoff
      await this.prisma.remoteCommand.update({
        where: { id: commandId },
        data: {
          retryCount: { increment: 1 },
          status: CommandStatus.QUEUED,
        },
      });
      this.logger.warn(`Retrying command [${commandId}] (Attempt ${command.retryCount + 1})`);
    } else {
      // Dead Letter Timeout
      const updated = await this.prisma.remoteCommand.update({
        where: { id: commandId },
        data: {
          status: CommandStatus.TIMED_OUT,
          timeoutAt: new Date(),
          errorMessage: 'Command timed out after maximum retry attempts',
        },
      });

      await this.redisService.del(`command:pending:${command.vehicleId}`);
      await this.emitKafkaEvent(KAFKA_TOPICS.COMMAND_FAILED, updated);
      this.logger.error(
        `Command [${commandId}] TIMED_OUT after ${COMMAND_CONSTANTS.MAX_COMMAND_RETRIES} retries`,
      );
    }
  }

  private async emitKafkaEvent(topic: string, command: any): Promise<void> {
    const payload: RemoteCommandEventPayload = {
      commandId: command.id,
      vehicleId: command.vehicleId,
      commandType: command.commandType,
      status: command.status,
      correlationId: command.correlationId,
      timestamp: new Date().toISOString(),
      errorMessage: command.errorMessage,
    };
    await this.kafkaProducer.emit(topic, payload);
  }
}
