import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaConsumerService } from '@app/kafka';
import { DiagnosticsService } from './diagnostics.service';
import { KAFKA_TOPICS, TelemetryProcessedEvent } from '@app/events';

@Injectable()
export class DiagnosticsKafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(DiagnosticsKafkaConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly diagnosticsService: DiagnosticsService,
  ) {}

  async onModuleInit() {
    await this.kafkaConsumer.subscribe(
      'diagnostics-service-group',
      [KAFKA_TOPICS.TELEMETRY_PROCESSED],
      async (topic, message) => {
        try {
          const payload: TelemetryProcessedEvent = JSON.parse(message.value.toString());
          await this.diagnosticsService.processTelemetryDiagnostics(payload);
        } catch (err) {
          this.logger.error(`Error consuming Kafka message on topic [${topic}]`, err);
        }
      },
    );
  }
}
