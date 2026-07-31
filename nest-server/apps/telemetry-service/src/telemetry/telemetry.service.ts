import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService, TelemetryRepository } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { TelemetryGateway } from './telemetry.gateway';
import { CreateTelemetryDto, BulkTelemetryDto, TelemetryQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper } from '@app/common';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telemetryRepository: TelemetryRepository,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly telemetryGateway: TelemetryGateway,
  ) {}

  async ingest(dto: CreateTelemetryDto): Promise<ApiResponseInterface> {
    // 1. Validate Vehicle Existence in PostgreSQL
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, deletedAt: null },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${dto.vehicleId} not found`);
    }

    const fleetId = dto.fleetId || vehicle.fleetId;
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    // 2. Normalize GeoJSON Point Format
    const location = {
      type: 'Point',
      coordinates: [dto.longitude, dto.latitude],
    };

    // 3. Store in MongoDB
    const telemetryDoc = await this.telemetryRepository.create({
      vehicleId: dto.vehicleId,
      fleetId,
      timestamp,
      latitude: dto.latitude,
      longitude: dto.longitude,
      location,
      altitude: dto.altitude || 0,
      heading: dto.heading || 0,
      speed: dto.speed || 0,
      rpm: dto.rpm || 0,
      odometer: dto.odometer || vehicle.odometer,
      fuelLevel: dto.fuelLevel || 100,
      batteryLevel: dto.batteryLevel || 100,
      batteryVoltage: dto.batteryVoltage || 400,
      coolantTemperature: dto.coolantTemperature || 90,
      engineTemperature: dto.engineTemperature || 95,
      oilPressure: dto.oilPressure || 35,
      tyrePressureFrontLeft: dto.tyrePressureFrontLeft || 32,
      tyrePressureFrontRight: dto.tyrePressureFrontRight || 32,
      tyrePressureRearLeft: dto.tyrePressureRearLeft || 32,
      tyrePressureRearRight: dto.tyrePressureRearRight || 32,
      engineStatus: dto.engineStatus || 'OFF',
      ignitionStatus: dto.ignitionStatus || 'OFF',
      gear: dto.gear || 'P',
      acceleratorPosition: dto.acceleratorPosition || 0,
      brakeStatus: dto.brakeStatus || false,
      doorStatus: dto.doorStatus || 'CLOSED',
      seatbeltStatus: dto.seatbeltStatus || 'FASTENED',
      chargingStatus: dto.chargingStatus || 'DISCONNECTED',
      signalStrength: dto.signalStrength || -75,
      gpsAccuracy: dto.gpsAccuracy || 2.5,
      source: dto.source || 'REST',
      rawPayload: dto.rawPayload || {},
      metadata: dto.metadata || {},
    } as any);

    // 4. Update Vehicle Odometer if greater
    if (dto.odometer && dto.odometer > vehicle.odometer) {
      await this.prisma.vehicle.update({
        where: { id: dto.vehicleId },
        data: { odometer: dto.odometer },
      });
    }

    // 5. Cache Latest Vehicle State in Redis
    const cacheKey = `vehicle:${dto.vehicleId}:latest`;
    const cachedState = {
      ...dto,
      fleetId,
      timestamp: timestamp.toISOString(),
      id: telemetryDoc._id.toString(),
    };
    await this.redisService.set(cacheKey, cachedState, 86400); // 24-hour TTL

    // 6. Publish Kafka Event
    await this.kafkaProducer.emit(KAFKA_TOPICS.TELEMETRY_PROCESSED, {
      telemetryId: telemetryDoc._id.toString(),
      vehicleId: dto.vehicleId,
      fleetId,
      timestamp: timestamp.toISOString(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      speed: dto.speed || 0,
      batteryLevel: dto.batteryLevel || 100,
      fuelLevel: dto.fuelLevel || 100,
      engineStatus: dto.engineStatus || 'OFF',
      source: dto.source || 'REST',
    });

    // 7. Broadcast Live State over Socket.IO WebSocket Gateway
    this.telemetryGateway.broadcastTelemetry(cachedState);

    this.logger.log(
      `Telemetry processed for vehicle [${dto.vehicleId}]: speed=${dto.speed || 0} km/h`,
    );
    return ResponseHelper.success(cachedState, 'Telemetry ingested successfully', 201);
  }

  async ingestBulk(dto: BulkTelemetryDto): Promise<ApiResponseInterface> {
    if (!dto.events || dto.events.length === 0) {
      throw new BadRequestException('Bulk telemetry list must not be empty');
    }

    const results = [];
    for (const event of dto.events) {
      try {
        const result = await this.ingest(event);
        results.push(result.data);
      } catch (err) {
        this.logger.error(`Error processing bulk item for vehicle [${event.vehicleId}]`, err);
      }
    }

    return ResponseHelper.success(
      { processedCount: results.length, totalCount: dto.events.length },
      `Bulk telemetry processed: ${results.length}/${dto.events.length} succeeded`,
      201,
    );
  }

  async getLatest(vehicleId: string): Promise<ApiResponseInterface> {
    // 1. Try Redis Cache
    const cacheKey = `vehicle:${vehicleId}:latest`;
    const cached = await this.redisService.get<any>(cacheKey);

    if (cached) {
      return ResponseHelper.success(cached, 'Latest telemetry fetched from cache');
    }

    // 2. Fallback to MongoDB
    const latestDoc = await this.telemetryRepository.findLatestByVehicleId(vehicleId);
    if (!latestDoc) {
      throw new NotFoundException(`No telemetry records found for vehicle ID ${vehicleId}`);
    }

    // Cache result back into Redis
    await this.redisService.set(cacheKey, latestDoc, 86400);

    return ResponseHelper.success(latestDoc, 'Latest telemetry fetched from database');
  }

  async getHistory(
    vehicleId: string,
    startDate?: string,
    endDate?: string,
    limit = 100,
  ): Promise<ApiResponseInterface> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const history = await this.telemetryRepository.findHistoryByVehicleId(
      vehicleId,
      start,
      end,
      limit,
    );

    return ResponseHelper.success(history, 'Telemetry history fetched successfully');
  }

  async search(query: TelemetryQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const mongoFilter: any = {};
    if (query.vehicleId) mongoFilter.vehicleId = query.vehicleId;
    if (query.fleetId) mongoFilter.fleetId = query.fleetId;
    if (query.engineStatus) mongoFilter.engineStatus = query.engineStatus;

    if (query.startDate || query.endDate) {
      mongoFilter.timestamp = {};
      if (query.startDate) mongoFilter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) mongoFilter.timestamp.$lte = new Date(query.endDate);
    }

    if (query.minSpeed !== undefined || query.maxSpeed !== undefined) {
      mongoFilter.speed = {};
      if (query.minSpeed !== undefined) mongoFilter.speed.$gte = Number(query.minSpeed);
      if (query.maxSpeed !== undefined) mongoFilter.speed.$lte = Number(query.maxSpeed);
    }

    const results = await this.telemetryRepository.findAll(mongoFilter);
    const paginated = results.slice(skip, skip + limit);

    return ResponseHelper.success(paginated, 'Telemetry records fetched successfully', 200, {
      page,
      limit,
      totalItems: results.length,
      totalPages: Math.ceil(results.length / limit),
    });
  }

  async findById(id: string): Promise<ApiResponseInterface> {
    const record = await this.telemetryRepository.findById(id);
    if (!record) {
      throw new NotFoundException(`Telemetry record with ID ${id} not found`);
    }
    return ResponseHelper.success(record);
  }

  async deleteTelemetry(id: string): Promise<ApiResponseInterface> {
    const deleted = await this.telemetryRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Telemetry record with ID ${id} not found`);
    }
    return ResponseHelper.success(null, 'Telemetry record deleted successfully');
  }
}
