import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { TripDetectionEngine } from './trip-detection.engine';
import { TripsKafkaConsumer } from './trips.consumer';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';

@Module({
  imports: [SharedAuthModule, DatabaseModule, RedisCacheModule, AppKafkaModule],
  controllers: [TripsController],
  providers: [TripsService, TripDetectionEngine, TripsKafkaConsumer],
  exports: [TripsService, TripDetectionEngine],
})
export class TripsModule {}
