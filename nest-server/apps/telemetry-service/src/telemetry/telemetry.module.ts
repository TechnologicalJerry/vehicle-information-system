import { Module } from '@nestjs/common';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { TelemetryAggregationService } from './telemetry-aggregation.service';
import { TelemetryGateway } from './telemetry.gateway';
import { TelemetrySubscriber } from './telemetry.subscriber';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';
import { AppMqttModule } from '@app/mqtt';

@Module({
  imports: [SharedAuthModule, DatabaseModule, RedisCacheModule, AppKafkaModule, AppMqttModule],
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryAggregationService, TelemetryGateway, TelemetrySubscriber],
  exports: [TelemetryService, TelemetryAggregationService, TelemetryGateway],
})
export class TelemetryModule {}
