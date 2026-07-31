import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@app/database';
import { KafkaProducerService } from '@app/kafka';
import { ReportExporterEngine } from './report-exporter.engine';
import { KAFKA_TOPICS } from '@app/events';
import { ReportStatus, ReportType, ExportFormat } from '@app/common';

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly exporterEngine: ReportExporterEngine,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processScheduledDailyReports() {
    this.logger.log('Executing Scheduled Daily Reports Generation Job');

    const schedules = await this.prisma.reportSchedule.findMany({
      where: { active: true },
    });

    for (const schedule of schedules) {
      try {
        const dummyData = [{ fleetId: 'all', generatedAt: new Date().toISOString() }];
        const exportRes = await this.exporterEngine.generateExportBuffer(
          schedule.reportType as unknown as ReportType,
          schedule.exportFormat as unknown as ExportFormat,
          dummyData,
        );

        const report = await this.prisma.report.create({
          data: {
            reportName: schedule.reportName,
            reportType: schedule.reportType,
            exportFormat: schedule.exportFormat,
            status: ReportStatus.COMPLETED,
            fileLocation: `/exports/${exportRes.filename}`,
            generatedAt: new Date(),
          },
        });

        await this.kafkaProducer.emit(KAFKA_TOPICS.REPORT_GENERATED, {
          reportId: report.id,
          reportName: report.reportName,
          reportType: report.reportType,
          exportFormat: report.exportFormat,
          status: report.status,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        this.logger.error(`Error processing scheduled report [${schedule.id}]`, err);
      }
    }
  }
}
