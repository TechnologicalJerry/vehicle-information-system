import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaConsumerService } from '@app/kafka';
import { AnalyticsSnapshotRepository } from '@app/database';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class AnalyticsKafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsKafkaConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly snapshotRepository: AnalyticsSnapshotRepository,
  ) {}

  async onModuleInit() {
    await this.kafkaConsumer.subscribe(
      'analytics-service-group',
      [
        KAFKA_TOPICS.TELEMETRY_SAVED,
        KAFKA_TOPICS.TRIP_COMPLETED,
        KAFKA_TOPICS.DIAGNOSTIC_DETECTED,
        KAFKA_TOPICS.DRIVER_SCORE_UPDATED,
        KAFKA_TOPICS.COMMAND_COMPLETED,
        KAFKA_TOPICS.OTA_COMPLETED,
      ],
      async (topic, message) => {
        try {
          const payload = JSON.parse(message.value.toString());
          await this.snapshotRepository.create({
            snapshotType: topic,
            fleetId: payload.fleetId,
            vehicleId: payload.vehicleId,
            driverId: payload.driverId,
            metrics: payload,
            timestamp: new Date(),
          } as any);
        } catch (err) {
          this.logger.error(
            `Error processing Kafka event in AnalyticsConsumer on topic [${topic}]`,
            err,
          );
        }
      },
    );
  }
}
