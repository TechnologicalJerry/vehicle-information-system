import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaConsumerService } from '@app/kafka';
import { AuditService } from './audit.service';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class AuditKafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(AuditKafkaConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.kafkaConsumer.subscribe(
      'audit-service-group',
      [
        KAFKA_TOPICS.USER_REGISTERED,
        KAFKA_TOPICS.USER_LOCKED,
        KAFKA_TOPICS.FLEET_CREATED,
        KAFKA_TOPICS.VEHICLE_CREATED,
        KAFKA_TOPICS.VEHICLE_ASSIGNED,
        KAFKA_TOPICS.VEHICLE_STATUS_CHANGED,
        KAFKA_TOPICS.TRIP_STARTED,
        KAFKA_TOPICS.TRIP_COMPLETED,
        KAFKA_TOPICS.DIAGNOSTIC_DETECTED,
        KAFKA_TOPICS.COMMAND_CREATED,
        KAFKA_TOPICS.COMMAND_COMPLETED,
        KAFKA_TOPICS.OTA_STARTED,
        KAFKA_TOPICS.OTA_COMPLETED,
        KAFKA_TOPICS.REPORT_GENERATED,
        KAFKA_TOPICS.ADMIN_SETTING_UPDATED,
        KAFKA_TOPICS.FEATURE_FLAG_UPDATED,
      ],
      async (topic, message) => {
        try {
          const payload = JSON.parse(message.value.toString());
          const serviceName = topic.split('.')[1]?.toUpperCase() || 'SYSTEM';

          await this.auditService.logAudit({
            service: `${serviceName}_SERVICE`,
            entityType: topic.split('.')[2]?.toUpperCase() || 'DOMAIN_EVENT',
            entityId:
              payload.vehicleId ||
              payload.fleetId ||
              payload.userId ||
              payload.reportId ||
              payload.commandId,
            action: topic,
            userId: payload.userId || payload.requestedBy || payload.createdBy,
            newValue: payload,
            correlationId: payload.correlationId,
            metadata: { topic, receivedAt: new Date().toISOString() },
          });
        } catch (err) {
          this.logger.error(
            `Error processing Kafka event in AuditConsumer on topic [${topic}]`,
            err,
          );
        }
      },
    );
  }
}
