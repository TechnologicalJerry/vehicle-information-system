import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportExporterEngine } from './report-exporter.engine';
import { ReportSchedulerService } from './report-scheduler.service';
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
  controllers: [ReportController],
  providers: [ReportService, ReportExporterEngine, ReportSchedulerService],
  exports: [ReportService, ReportExporterEngine],
})
export class ReportModule {}
