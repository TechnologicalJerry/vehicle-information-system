import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaConsumerService } from '@app/kafka';
import { TripDetectionEngine } from './trip-detection.engine';
import { KAFKA_TOPICS, TelemetryProcessedEvent } from '@app/events';

@Injectable()
export class TripsKafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(TripsKafkaConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly tripDetectionEngine: TripDetectionEngine,
  ) {}

  async onModuleInit() {
    await this.kafkaConsumer.subscribe(
      'trip-service-group',
      [KAFKA_TOPICS.TELEMETRY_PROCESSED],
      async (topic, message) => {
        try {
          const payload: TelemetryProcessedEvent = JSON.parse(message.value.toString());
          await this.tripDetectionEngine.processTelemetry(payload);
        } catch (err) {
          this.logger.error(`Error consuming Kafka message on topic [${topic}]`, err);
        }
      },
    );
  }
}
