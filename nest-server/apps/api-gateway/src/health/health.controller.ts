import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@app/database';
import { RedisHealthIndicator } from '@app/cache';
import { KafkaHealthIndicator } from '@app/kafka';
import { MqttHealthIndicator } from '@app/mqtt';
import { Public } from '@app/auth';

@ApiTags('Health & Operations')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private mongooseHealth: MongooseHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private kafkaHealth: KafkaHealthIndicator,
    private mqttHealth: MqttHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Check infrastructure and service health' })
  @ApiResponse({ status: 200, description: 'Service and dependencies are healthy' })
  @ApiResponse({ status: 503, description: 'Service or dependency is unhealthy' })
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('postgresql'),
      () => this.mongooseHealth.pingCheck('mongodb'),
      () => this.redisHealth.isHealthy('redis'),
      () => this.kafkaHealth.isHealthy('kafka'),
      () => this.mqttHealth.isHealthy('mqtt'),
    ]);
  }
}
