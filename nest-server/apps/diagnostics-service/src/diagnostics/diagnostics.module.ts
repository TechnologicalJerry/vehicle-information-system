import { Module } from '@nestjs/common';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { DtcDetectorEngine } from './dtc-detector.engine';
import { HealthScoreCalculator } from './health-score.calculator';
import { DiagnosticsKafkaConsumer } from './diagnostics.consumer';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';

@Module({
  imports: [SharedAuthModule, DatabaseModule, RedisCacheModule, AppKafkaModule],
  controllers: [DiagnosticsController],
  providers: [
    DiagnosticsService,
    DtcDetectorEngine,
    HealthScoreCalculator,
    DiagnosticsKafkaConsumer,
  ],
  exports: [DiagnosticsService, DtcDetectorEngine, HealthScoreCalculator],
})
export class DiagnosticsModule {}
