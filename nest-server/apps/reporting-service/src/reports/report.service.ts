import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService, ReportCacheRepository } from '@app/database';
import { KafkaProducerService } from '@app/kafka';
import { ReportExporterEngine } from './report-exporter.engine';
import { CreateReportDto, ExportReportDto, ScheduleReportDto, ReportQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper, ReportStatus, ExportFormat } from '@app/common';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportCacheRepository: ReportCacheRepository,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly exporterEngine: ReportExporterEngine,
  ) {}

  async createReport(dto: CreateReportDto, userId?: string): Promise<ApiResponseInterface> {
    const report = await this.prisma.report.create({
      data: {
        reportName: dto.reportName,
        reportType: dto.reportType,
        exportFormat: dto.exportFormat || ExportFormat.CSV,
        filters: dto.filters || {},
        generatedBy: userId,
        status: ReportStatus.PROCESSING,
      },
    });

    // Simulate async data gathering & generation
    const rawData = await this.gatherReportData(dto.reportType, dto.filters);
    const exportResult = await this.exporterEngine.generateExportBuffer(
      dto.reportType,
      dto.exportFormat || ExportFormat.CSV,
      rawData,
    );

    const completed = await this.prisma.report.update({
      where: { id: report.id },
      data: {
        status: ReportStatus.COMPLETED,
        fileLocation: `/exports/${exportResult.filename}`,
        generatedAt: new Date(),
      },
    });

    await this.reportCacheRepository.create({
      reportId: completed.id,
      reportType: completed.reportType,
      format: completed.exportFormat,
      data: rawData,
      cachedAt: new Date(),
    } as any);

    await this.kafkaProducer.emit(KAFKA_TOPICS.REPORT_GENERATED, {
      reportId: completed.id,
      reportName: completed.reportName,
      reportType: completed.reportType,
      exportFormat: completed.exportFormat,
      status: completed.status,
      timestamp: new Date().toISOString(),
    });

    return ResponseHelper.success(completed, 'Report generated successfully', 201);
  }

  async exportReportInstant(
    dto: ExportReportDto,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const rawData = await this.gatherReportData(dto.reportType, dto.filters);
    return this.exporterEngine.generateExportBuffer(dto.reportType, dto.exportFormat, rawData);
  }

  async scheduleReport(dto: ScheduleReportDto, userId?: string): Promise<ApiResponseInterface> {
    const schedule = await this.prisma.reportSchedule.create({
      data: {
        reportName: dto.reportName,
        reportType: dto.reportType,
        exportFormat: dto.exportFormat,
        cronExpression: dto.cronExpression,
        recipientEmails: dto.recipientEmails,
        createdBy: userId,
        active: true,
      },
    });

    return ResponseHelper.success(schedule, 'Report schedule created successfully', 201);
  }

  async findAllReports(query: ReportQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.reportType) where.reportType = query.reportType;
    if (query.exportFormat) where.exportFormat = query.exportFormat;
    if (query.status) where.status = query.status;

    const [reports, totalItems] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return ResponseHelper.success(reports, 'Reports fetched successfully', 200, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }

  async findReportById(id: string): Promise<ApiResponseInterface> {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return ResponseHelper.success(report);
  }

  async deleteReport(id: string): Promise<ApiResponseInterface> {
    const existing = await this.prisma.report.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    await this.prisma.report.delete({ where: { id } });
    return ResponseHelper.success(null, 'Report deleted successfully');
  }

  private async gatherReportData(reportType: string, filters: any = {}): Promise<any[]> {
    if (reportType === 'VEHICLE') {
      return this.prisma.vehicle.findMany({
        take: 100,
        select: {
          id: true,
          vin: true,
          registrationNumber: true,
          manufacturer: true,
          model: true,
          status: true,
          odometer: true,
        },
      });
    }

    if (reportType === 'FLEET') {
      return this.prisma.fleet.findMany({
        take: 50,
        select: {
          id: true,
          fleetCode: true,
          fleetName: true,
          status: true,
          totalVehicles: true,
        },
      });
    }

    if (reportType === 'TRIP') {
      return this.prisma.trip.findMany({
        take: 100,
        select: {
          id: true,
          tripNumber: true,
          vehicleId: true,
          distance: true,
          duration: true,
          tripStatus: true,
        },
      });
    }

    // Default fallback dataset
    return [
      {
        reportType,
        generatedAt: new Date().toISOString(),
        status: 'SUCCESS',
        filters: JSON.stringify(filters),
      },
    ];
  }
}
