import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { LocationMongoRepository } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { GeofencesService } from '../geofences/geofences.service';
import { LocationQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper } from '@app/common';
import { KAFKA_TOPICS, TelemetryProcessedEvent } from '@app/events';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    private readonly locationRepository: LocationMongoRepository,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly geofencesService: GeofencesService,
  ) {}

  async processLocation(payload: TelemetryProcessedEvent): Promise<void> {
    const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

    // 1. Store location point in MongoDB
    const locationDoc = await this.locationRepository.create({
      vehicleId: payload.vehicleId,
      fleetId: payload.fleetId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      location: {
        type: 'Point',
        coordinates: [payload.longitude, payload.latitude],
      },
      speed: payload.speed || 0,
      timestamp,
      source: payload.source || 'KAFKA',
    } as any);

    // 2. Cache Latest Location in Redis
    const cacheKey = `vehicle:${payload.vehicleId}:location`;
    const cachedLocation = {
      vehicleId: payload.vehicleId,
      fleetId: payload.fleetId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      speed: payload.speed || 0,
      timestamp: timestamp.toISOString(),
      id: locationDoc._id.toString(),
    };
    await this.redisService.set(cacheKey, cachedLocation, 86400);

    // 3. Evaluate Geofences for fleet
    await this.geofencesService.evaluateGeofences(
      payload.vehicleId,
      payload.fleetId,
      payload.latitude,
      payload.longitude,
      timestamp,
    );

    // 4. Publish Kafka Event
    await this.kafkaProducer.emit(KAFKA_TOPICS.LOCATION_UPDATED, cachedLocation);
  }

  async getLatest(vehicleId: string): Promise<ApiResponseInterface> {
    const cacheKey = `vehicle:${vehicleId}:location`;
    const cached = await this.redisService.get<any>(cacheKey);

    if (cached) {
      return ResponseHelper.success(cached, 'Latest location fetched from cache');
    }

    const latestDoc = await this.locationRepository.findLatestByVehicleId(vehicleId);
    if (!latestDoc) {
      throw new NotFoundException(`No location history found for vehicle ID ${vehicleId}`);
    }

    await this.redisService.set(cacheKey, latestDoc, 86400);
    return ResponseHelper.success(latestDoc, 'Latest location fetched from database');
  }

  async getHistory(
    vehicleId: string,
    startDate?: string,
    endDate?: string,
    limit = 100,
  ): Promise<ApiResponseInterface> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const history = await this.locationRepository.findHistoryByVehicleId(
      vehicleId,
      start,
      end,
      limit,
    );

    return ResponseHelper.success(history, 'Location history fetched successfully');
  }

  async search(query: LocationQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const mongoFilter: any = {};
    if (query.vehicleId) mongoFilter.vehicleId = query.vehicleId;
    if (query.fleetId) mongoFilter.fleetId = query.fleetId;

    if (query.startDate || query.endDate) {
      mongoFilter.timestamp = {};
      if (query.startDate) mongoFilter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) mongoFilter.timestamp.$lte = new Date(query.endDate);
    }

    // Spatial bounding box query
    if (
      query.minLat !== undefined &&
      query.maxLat !== undefined &&
      query.minLng !== undefined &&
      query.maxLng !== undefined
    ) {
      mongoFilter.location = {
        $geoWithin: {
          $box: [
            [Number(query.minLng), Number(query.minLat)],
            [Number(query.maxLng), Number(query.maxLat)],
          ],
        },
      };
    }

    const results = await this.locationRepository.findAll(mongoFilter);
    const paginated = results.slice(skip, skip + limit);

    return ResponseHelper.success(paginated, 'Location search results returned', 200, {
      page,
      limit,
      totalItems: results.length,
      totalPages: Math.ceil(results.length / limit),
    });
  }
}
