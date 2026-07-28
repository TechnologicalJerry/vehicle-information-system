import { Module } from '@nestjs/common';
import { DriverBehaviourController } from './driver-behaviour.controller';
import { DriverBehaviourService } from './driver-behaviour.service';
import { BehaviourDetectorEngine } from './behaviour-detector.engine';
import { DriverScoreCalculator } from './driver-score.calculator';
import { DriverBehaviourKafkaConsumer } from './driver-behaviour.consumer';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';

@Module({
  imports: [SharedAuthModule, DatabaseModule, RedisCacheModule, AppKafkaModule],
  controllers: [DriverBehaviourController],
  providers: [
    DriverBehaviourService,
    BehaviourDetectorEngine,
    DriverScoreCalculator,
    DriverBehaviourKafkaConsumer,
  ],
  exports: [DriverBehaviourService, BehaviourDetectorEngine, DriverScoreCalculator],
})
export class DriverBehaviourModule {}
