import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, Admin } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const brokers = this.configService.get<string[]>('kafka.brokers', ['localhost:9092']);
    const clientId = this.configService.get<string>('kafka.clientId', 'vis-client');

    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: {
        initialRetryTime: 300,
        retries: 5,
      },
    });

    this.producer = this.kafka.producer();
    this.admin = this.kafka.admin();
  }

  async onModuleDestroy() {
    if (this.producer) {
      await this.producer.disconnect();
    }
    if (this.admin) {
      await this.admin.disconnect();
    }
  }

  getKafkaInstance(): Kafka {
    return this.kafka;
  }

  async getProducer(): Promise<Producer> {
    if (!this.producer) {
      this.producer = this.kafka.producer();
    }
    await this.producer.connect();
    return this.producer;
  }

  createConsumer(groupId: string): Consumer {
    return this.kafka.consumer({ groupId });
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.admin.connect();
      const metadata = await this.admin.fetchTopicMetadata();
      await this.admin.disconnect();
      return !!metadata;
    } catch (err) {
      this.logger.error('Kafka health check error', err);
      return false;
    }
  }
}
