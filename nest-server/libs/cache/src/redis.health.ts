import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from './redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redisService.ping();
      const isHealthy = pong === 'PONG';
      return this.getStatus(key, isHealthy);
    } catch (error) {
      throw new HealthCheckError(
        'Redis ping check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
