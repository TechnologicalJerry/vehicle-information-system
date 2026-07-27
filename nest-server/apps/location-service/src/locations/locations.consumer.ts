import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaConsumerService } from '@app/kafka';
import { LocationsService } from './locations.service';
import { KAFKA_TOPICS, TelemetryProcessedEvent } from '@app/events';

@Injectable()
export class LocationsKafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(LocationsKafkaConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly locationsService: LocationsService,
  ) {}

  async onModuleInit() {
    await this.kafkaConsumer.subscribe(
      'location-service-group',
      [KAFKA_TOPICS.TELEMETRY_PROCESSED],
      async (topic, message) => {
        try {
          const payload: TelemetryProcessedEvent = JSON.parse(message.value.toString());
          this.logger.log(`Kafka Event Consumed [${topic}] for vehicle [${payload.vehicleId}]`);
          await this.locationsService.processLocation(payload);
        } catch (err) {
          this.logger.error(`Error consuming Kafka message on topic [${topic}]`, err);
        }
      },
    );
  }
}
