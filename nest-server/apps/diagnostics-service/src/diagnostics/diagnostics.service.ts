import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService, DiagnosticEventRepository } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { DtcDetectorEngine } from './dtc-detector.engine';
import { HealthScoreCalculator } from './health-score.calculator';
import { DiagnosticQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper, DtcStatus, MaintenancePriority } from '@app/common';
import { KAFKA_TOPICS } from '@app/events';
import { TelemetryProcessedEvent } from '@app/events';

@Injectable()
export class DiagnosticsService {
  private readonly logger = new Logger(DiagnosticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly diagnosticEventRepository: DiagnosticEventRepository,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly dtcDetectorEngine: DtcDetectorEngine,
    private readonly healthScoreCalculator: HealthScoreCalculator,
  ) {}

  async processTelemetryDiagnostics(payload: TelemetryProcessedEvent): Promise<void> {
    // 1. Run DTC Detection Engine
    await this.dtcDetectorEngine.evaluateTelemetry(payload);

    // 2. Fetch Active DTCs for Vehicle
    const activeDtcs = await this.prisma.dtc.findMany({
      where: { vehicleId: payload.vehicleId, status: DtcStatus.ACTIVE },
    });

    // 3. Calculate Vehicle Health Score
    const healthResult = this.healthScoreCalculator.calculateHealthScore(
      payload,
      activeDtcs as any,
    );

    // 4. Cache Health Score in Redis
    const cacheKey = `vehicle:${payload.vehicleId}:health`;
    await this.redisService.set(cacheKey, healthResult, 86400);

    // 5. Generate Maintenance Recommendation if health score < 75 or recommendations present
    if (healthResult.overallScore < 75 && healthResult.recommendations.length > 0) {
      const priority =
        healthResult.overallScore < 50 ? MaintenancePriority.CRITICAL : MaintenancePriority.HIGH;

      for (const recText of healthResult.recommendations) {
        await this.prisma.maintenanceRecommendation.create({
          data: {
            vehicleId: payload.vehicleId,
            recommendation: recText,
            priority,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            category: 'HEALTH_WARNING',
          },
        });
      }
    }

    // 6. Publish Kafka Event
    await this.kafkaProducer.emit(KAFKA_TOPICS.VEHICLE_HEALTH_UPDATED, {
      vehicleId: payload.vehicleId,
      overallScore: healthResult.overallScore,
      trend: healthResult.trend,
      activeDtcCount: activeDtcs.length,
      updatedAt: new Date().toISOString(),
    });

    this.logger.log(
      `Vehicle [${payload.vehicleId}] Health Score evaluated: ${healthResult.overallScore}/100 (${healthResult.trend})`,
    );
  }

  async findAllDtcs(query: DiagnosticQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.fleetId) where.fleetId = query.fleetId;
    if (query.category) where.category = query.category;
    if (query.severity) where.severity = query.severity;
    if (query.status) where.status = query.status;

    const [dtcs, totalItems] = await Promise.all([
      this.prisma.dtc.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastDetectedAt: 'desc' },
        include: { vehicle: { select: { vin: true, registrationNumber: true } } },
      }),
      this.prisma.dtc.count({ where }),
    ]);

    return ResponseHelper.success(dtcs, 'DTCs fetched successfully', 200, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }

  async findDtcById(id: string): Promise<ApiResponseInterface> {
    const dtc = await this.prisma.dtc.findUnique({
      where: { id },
      include: { vehicle: { select: { id: true, vin: true, registrationNumber: true } } },
    });

    if (!dtc) {
      throw new NotFoundException(`DTC with ID ${id} not found`);
    }

    return ResponseHelper.success(dtc);
  }

  async findVehicleDtcs(vehicleId: string): Promise<ApiResponseInterface> {
    const dtcs = await this.prisma.dtc.findMany({
      where: { vehicleId },
      orderBy: { lastDetectedAt: 'desc' },
    });
    return ResponseHelper.success(dtcs);
  }

  async getDiagnosticHistory(vehicleId: string): Promise<ApiResponseInterface> {
    const events = await this.diagnosticEventRepository.findByVehicleId(vehicleId, 100);
    return ResponseHelper.success(events, 'Diagnostic history fetched from MongoDB');
  }

  async getHealthScore(vehicleId: string): Promise<ApiResponseInterface> {
    const cacheKey = `vehicle:${vehicleId}:health`;
    const cached = await this.redisService.get<any>(cacheKey);

    if (cached) {
      return ResponseHelper.success(cached, 'Vehicle health score fetched from Redis cache');
    }

    const activeDtcs = await this.prisma.dtc.findMany({
      where: { vehicleId, status: DtcStatus.ACTIVE },
    });

    const fallbackResult = {
      overallScore: activeDtcs.length === 0 ? 100 : Math.max(50, 100 - activeDtcs.length * 10),
      componentScores: {
        engineScore: 100,
        batteryScore: 100,
        temperatureScore: 100,
        oilPressureScore: 100,
        tyreScore: 100,
      },
      trend: activeDtcs.length === 0 ? 'STABLE' : 'DEGRADING',
      recommendations: activeDtcs.map((d) => `Resolve DTC ${d.code}: ${d.title}`),
    };

    return ResponseHelper.success(fallbackResult);
  }

  async getRecommendations(vehicleId: string): Promise<ApiResponseInterface> {
    const recommendations = await this.prisma.maintenanceRecommendation.findMany({
      where: { vehicleId },
      orderBy: { generatedAt: 'desc' },
      take: 20,
    });
    return ResponseHelper.success(recommendations);
  }
}
