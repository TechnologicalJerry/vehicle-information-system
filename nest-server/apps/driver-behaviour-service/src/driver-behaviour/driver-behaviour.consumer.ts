import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaConsumerService } from '@app/kafka';
import { DriverBehaviourService } from './driver-behaviour.service';
import { KAFKA_TOPICS, TelemetryProcessedEvent } from '@app/events';

@Injectable()
export class DriverBehaviourKafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(DriverBehaviourKafkaConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly driverBehaviourService: DriverBehaviourService,
  ) {}

  async onModuleInit() {
    await this.kafkaConsumer.subscribe(
      'driver-behaviour-service-group',
      [KAFKA_TOPICS.TELEMETRY_PROCESSED, KAFKA_TOPICS.TRIP_COMPLETED],
      async (topic, message) => {
        try {
          const payload: TelemetryProcessedEvent = JSON.parse(message.value.toString());
          await this.driverBehaviourService.processDriverTelemetry(payload);
        } catch (err) {
          this.logger.error(`Error consuming Kafka message on topic [${topic}]`, err);
        }
      },
    );
  }
}
