import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { KafkaService } from './kafka.service';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(private readonly kafkaService: KafkaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isHealthy = await this.kafkaService.checkHealth();
      return this.getStatus(key, isHealthy);
    } catch (error) {
      throw new HealthCheckError(
        'Kafka health check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
