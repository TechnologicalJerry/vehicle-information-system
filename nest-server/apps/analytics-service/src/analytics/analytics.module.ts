import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AggregationEngine } from './aggregation.engine';
import { AnalyticsCronService } from './analytics-cron.service';
import { AnalyticsKafkaConsumer } from './analytics.consumer';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SharedAuthModule,
    DatabaseModule,
    RedisCacheModule,
    AppKafkaModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AggregationEngine, AnalyticsCronService, AnalyticsKafkaConsumer],
  exports: [AnalyticsService, AggregationEngine],
})
export class AnalyticsModule {}
