import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from './kafka.service';

@Injectable()
export class KafkaProducerService {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(private readonly kafkaService: KafkaService) {}

  async emit<T = any>(topic: string, message: T, key?: string): Promise<void> {
    try {
      const producer = await this.kafkaService.getProducer();
      await producer.send({
        topic,
        messages: [
          {
            key: key || undefined,
            value: JSON.stringify(message),
            headers: {
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });
      this.logger.log(`Kafka message published to topic [${topic}]`);
    } catch (error) {
      this.logger.error(`Failed to publish message to topic [${topic}]`, error);
      throw error;
    }
  }
}
