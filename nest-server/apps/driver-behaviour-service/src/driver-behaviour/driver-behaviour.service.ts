import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, BehaviourEventRepository } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { BehaviourDetectorEngine } from './behaviour-detector.engine';
import { DriverScoreCalculator } from './driver-score.calculator';
import { DriverBehaviourQueryDto, DriverRankingQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper, RankingPeriod } from '@app/common';
import { KAFKA_TOPICS, TelemetryProcessedEvent } from '@app/events';

@Injectable()
export class DriverBehaviourService {
  private readonly logger = new Logger(DriverBehaviourService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviourEventRepository: BehaviourEventRepository,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly behaviourDetectorEngine: BehaviourDetectorEngine,
    private readonly driverScoreCalculator: DriverScoreCalculator,
  ) {}

  async processDriverTelemetry(payload: TelemetryProcessedEvent): Promise<void> {
    // 1. Evaluate Safety Events
    await this.behaviourDetectorEngine.evaluateTelemetry(payload);

    // 2. Lookup Driver Assignment
    const driverAssignment = await this.prisma.driverAssignment.findFirst({
      where: { vehicleId: payload.vehicleId, status: 'ACTIVE' },
    });

    if (driverAssignment?.driverId) {
      await this.recalculateDriverScore(driverAssignment.driverId);
    }
  }

  async recalculateDriverScore(driverId: string): Promise<void> {
    const events = await this.behaviourEventRepository.findByDriverId(driverId, 100);
    const scoreResult = this.driverScoreCalculator.calculateDriverScore(events);

    const updated = await this.prisma.driverScore.upsert({
      where: { id: driverId },
      update: {
        overallScore: scoreResult.overallScore,
        accelerationScore: scoreResult.accelerationScore,
        brakingScore: scoreResult.brakingScore,
        corneringScore: scoreResult.corneringScore,
        speedingScore: scoreResult.speedingScore,
        idlingScore: scoreResult.idlingScore,
        safetyEventsCount: scoreResult.safetyEventsCount,
        evaluatedAt: new Date(),
      },
      create: {
        id: driverId,
        driverId,
        overallScore: scoreResult.overallScore,
        accelerationScore: scoreResult.accelerationScore,
        brakingScore: scoreResult.brakingScore,
        corneringScore: scoreResult.corneringScore,
        speedingScore: scoreResult.speedingScore,
        idlingScore: scoreResult.idlingScore,
        safetyEventsCount: scoreResult.safetyEventsCount,
        evaluatedAt: new Date(),
      },
    });

    // Cache in Redis
    const cacheKey = `driver:${driverId}:score`;
    await this.redisService.set(cacheKey, updated, 86400);

    // Publish Kafka Event
    await this.kafkaProducer.emit(KAFKA_TOPICS.DRIVER_SCORE_UPDATED, {
      driverId,
      overallScore: scoreResult.overallScore,
      safetyEventsCount: scoreResult.safetyEventsCount,
      evaluatedAt: new Date().toISOString(),
    });

    this.logger.log(`Driver Score updated [${driverId}]: ${scoreResult.overallScore}/100`);
  }

  async findAllEvents(query: DriverBehaviourQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const mongoFilter: any = {};
    if (query.driverId) mongoFilter.driverId = query.driverId;
    if (query.vehicleId) mongoFilter.vehicleId = query.vehicleId;
    if (query.eventType) mongoFilter.eventType = query.eventType;

    const results = await this.behaviourEventRepository.findAll(mongoFilter);
    const paginated = results.slice(skip, skip + limit);

    return ResponseHelper.success(paginated, 'Driver behaviour events fetched successfully', 200, {
      page,
      limit,
      totalItems: results.length,
      totalPages: Math.ceil(results.length / limit),
    });
  }

  async findDriverEvents(driverId: string): Promise<ApiResponseInterface> {
    const events = await this.behaviourEventRepository.findByDriverId(driverId, 100);
    return ResponseHelper.success(events);
  }

  async findVehicleEvents(vehicleId: string): Promise<ApiResponseInterface> {
    const events = await this.behaviourEventRepository.findByVehicleId(vehicleId, 100);
    return ResponseHelper.success(events);
  }

  async getDriverScore(driverId: string): Promise<ApiResponseInterface> {
    const cacheKey = `driver:${driverId}:score`;
    const cached = await this.redisService.get<any>(cacheKey);

    if (cached) {
      return ResponseHelper.success(cached, 'Driver score fetched from Redis cache');
    }

    const scoreDoc = await this.prisma.driverScore.findUnique({
      where: { driverId },
      include: { driver: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    if (!scoreDoc) {
      return ResponseHelper.success({
        driverId,
        overallScore: 100,
        accelerationScore: 100,
        brakingScore: 100,
        corneringScore: 100,
        speedingScore: 100,
        idlingScore: 100,
        safetyEventsCount: 0,
      });
    }

    await this.redisService.set(cacheKey, scoreDoc, 86400);
    return ResponseHelper.success(scoreDoc);
  }

  async getFleetRankings(query: DriverRankingQueryDto): Promise<ApiResponseInterface> {
    const fleetId = query.fleetId;
    const period = query.period || RankingPeriod.MONTHLY;

    const rankings = await this.prisma.driverRanking.findMany({
      where: { fleetId, period },
      orderBy: { rank: 'asc' },
      take: 20,
      include: { driver: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    return ResponseHelper.success(rankings, 'Driver rankings fetched successfully');
  }
}
