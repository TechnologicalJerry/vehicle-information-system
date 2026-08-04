import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Consumer, EachMessagePayload } from 'kafkajs';
import { KafkaService } from './kafka.service';

export abstract class AbstractKafkaConsumer implements OnModuleInit, OnModuleDestroy {
  protected readonly logger = new Logger(this.constructor.name);
  protected consumer: Consumer;

  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly groupId: string,
    protected readonly topics: string[],
  ) {}

  async onModuleInit() {
    this.consumer = this.kafkaService.createConsumer(this.groupId);
    await this.consumer.connect();

    for (const topic of this.topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          await this.handleMessage(payload);
        } catch (err) {
          this.logger.error(`Error handling message from topic ${payload.topic}`, err);
        }
      },
    });
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect();
    }
  }

  abstract handleMessage(payload: EachMessagePayload): Promise<void>;
}

@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumers: Consumer[] = [];

  constructor(private readonly kafkaService: KafkaService) {}

  async subscribe(
    groupId: string,
    topics: string[],
    onMessage: (topic: string, message: { value: Buffer }) => Promise<void>,
  ): Promise<Consumer | null> {
    if (!this.kafkaService || typeof this.kafkaService.createConsumer !== 'function') {
      this.logger.warn(`KafkaService not available, skipping subscription for group [${groupId}]`);
      return null;
    }
    const consumer = this.kafkaService.createConsumer(groupId);
    await consumer.connect();

    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (message.value) {
          await onMessage(topic, { value: message.value });
        }
      },
    });

    this.consumers.push(consumer);
    return consumer;
  }

  async onModuleDestroy() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
