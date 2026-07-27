import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';
import { AppMqttModule } from '@app/mqtt';

@Module({
  imports: [TerminusModule, DatabaseModule, RedisCacheModule, AppKafkaModule, AppMqttModule],
  controllers: [HealthController],
})
export class HealthModule {}
