import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, TripRouteRepository } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { TripStatus, TRIP_CONSTANTS } from '@app/common';
import { KAFKA_TOPICS, TelemetryProcessedEvent, TripEventPayload } from '@app/events';

interface ActiveTripState {
  tripId: string;
  tripNumber: string;
  vehicleId: string;
  fleetId?: string;
  driverId?: string;
  startTime: string;
  startLatitude: number;
  startLongitude: number;
  latestLatitude: number;
  latestLongitude: number;
  distance: number;
  maxSpeed: number;
  totalSpeed: number;
  speedCount: number;
  idleSeconds: number;
  lastTimestamp: string;
  initialBattery?: number;
  initialFuel?: number;
}

@Injectable()
export class TripDetectionEngine {
  private readonly logger = new Logger(TripDetectionEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tripRouteRepository: TripRouteRepository,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async processTelemetry(payload: TelemetryProcessedEvent): Promise<void> {
    const { vehicleId, speed, timestamp } = payload;
    const cacheKey = `vehicle:${vehicleId}:active_trip`;
    const eventTime = timestamp ? new Date(timestamp) : new Date();

    const activeTrip = await this.redisService.get<ActiveTripState>(cacheKey);

    const isIgnitionOn = payload.engineStatus === 'RUNNING' || payload.engineStatus === 'ON';
    const isMoving = speed >= TRIP_CONSTANTS.SPEED_THRESHOLD_KMH;

    if (!activeTrip) {
      // Check if conditions met to START TRIP automatically
      if (isIgnitionOn && isMoving) {
        await this.startAutomaticTrip(payload, eventTime, cacheKey);
      }
    } else {
      // Check if conditions met to END TRIP automatically
      const isIgnitionOff = payload.engineStatus === 'OFF';
      const isIdleTimeout =
        speed === 0 &&
        (new Date().getTime() - new Date(activeTrip.lastTimestamp).getTime()) / 60000 >=
          TRIP_CONSTANTS.IDLE_TIMEOUT_MINUTES;

      if (isIgnitionOff || isIdleTimeout) {
        await this.endAutomaticTrip(activeTrip, payload, eventTime, cacheKey);
      } else {
        // UPDATE active trip in progress
        await this.updateActiveTrip(activeTrip, payload, eventTime, cacheKey);
      }
    }
  }

  private async startAutomaticTrip(
    payload: TelemetryProcessedEvent,
    eventTime: Date,
    cacheKey: string,
  ): Promise<void> {
    // Find active assigned driver for vehicle if exists
    const driverAssignment = await this.prisma.driverAssignment.findFirst({
      where: { vehicleId: payload.vehicleId, status: 'ACTIVE' },
    });

    const tripNumber = `TRIP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const trip = await this.prisma.trip.create({
      data: {
        vehicleId: payload.vehicleId,
        fleetId: payload.fleetId,
        driverId: driverAssignment?.driverId,
        tripNumber,
        startTime: eventTime,
        startLatitude: payload.latitude,
        startLongitude: payload.longitude,
        distance: 0.0,
        averageSpeed: payload.speed || 0,
        maximumSpeed: payload.speed || 0,
        tripStatus: TripStatus.IN_PROGRESS,
      },
    });

    // Record initial route point in MongoDB
    await this.tripRouteRepository.create({
      tripId: trip.id,
      vehicleId: payload.vehicleId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      location: { type: 'Point', coordinates: [payload.longitude, payload.latitude] },
      timestamp: eventTime,
      speed: payload.speed || 0,
    } as any);

    const tripState: ActiveTripState = {
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      vehicleId: payload.vehicleId,
      fleetId: payload.fleetId,
      driverId: driverAssignment?.driverId,
      startTime: eventTime.toISOString(),
      startLatitude: payload.latitude,
      startLongitude: payload.longitude,
      latestLatitude: payload.latitude,
      latestLongitude: payload.longitude,
      distance: 0.0,
      maxSpeed: payload.speed || 0,
      totalSpeed: payload.speed || 0,
      speedCount: 1,
      idleSeconds: 0,
      lastTimestamp: eventTime.toISOString(),
      initialBattery: payload.batteryLevel,
      initialFuel: payload.fuelLevel,
    };

    await this.redisService.set(cacheKey, tripState, 86400);

    this.logger.log(
      `Automatic TRIP STARTED [${trip.tripNumber}] for vehicle [${payload.vehicleId}]`,
    );
    const kafkaPayload: TripEventPayload = {
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      vehicleId: payload.vehicleId,
      fleetId: payload.fleetId,
      driverId: driverAssignment?.driverId,
      startTime: eventTime.toISOString(),
      status: TripStatus.IN_PROGRESS,
    };
    await this.kafkaProducer.emit(KAFKA_TOPICS.TRIP_STARTED, kafkaPayload);
  }

  private async updateActiveTrip(
    activeTrip: ActiveTripState,
    payload: TelemetryProcessedEvent,
    eventTime: Date,
    cacheKey: string,
  ): Promise<void> {
    // Calculate incremental distance (Haversine formula in km)
    const incrementalDistance = this.calculateDistanceKm(
      activeTrip.latestLatitude,
      activeTrip.latestLongitude,
      payload.latitude,
      payload.longitude,
    );

    activeTrip.distance += incrementalDistance;
    activeTrip.latestLatitude = payload.latitude;
    activeTrip.latestLongitude = payload.longitude;
    activeTrip.maxSpeed = Math.max(activeTrip.maxSpeed, payload.speed || 0);
    activeTrip.totalSpeed += payload.speed || 0;
    activeTrip.speedCount += 1;
    activeTrip.lastTimestamp = eventTime.toISOString();

    if (payload.speed === 0) {
      activeTrip.idleSeconds += 5; // Assuming 5 second ping interval
    }

    await this.redisService.set(cacheKey, activeTrip, 86400);

    // Record route point in MongoDB
    await this.tripRouteRepository.create({
      tripId: activeTrip.tripId,
      vehicleId: payload.vehicleId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      location: { type: 'Point', coordinates: [payload.longitude, payload.latitude] },
      timestamp: eventTime,
      speed: payload.speed || 0,
    } as any);

    // Update in-progress trip distance in PostgreSQL
    await this.prisma.trip.update({
      where: { id: activeTrip.tripId },
      data: {
        distance: Math.round(activeTrip.distance * 100) / 100,
        maximumSpeed: activeTrip.maxSpeed,
        averageSpeed: Math.round((activeTrip.totalSpeed / activeTrip.speedCount) * 100) / 100,
      },
    });
  }

  private async endAutomaticTrip(
    activeTrip: ActiveTripState,
    payload: TelemetryProcessedEvent,
    eventTime: Date,
    cacheKey: string,
  ): Promise<void> {
    const durationSeconds = Math.max(
      0,
      Math.floor((eventTime.getTime() - new Date(activeTrip.startTime).getTime()) / 1000),
    );
    const avgSpeed =
      activeTrip.speedCount > 0
        ? Math.round((activeTrip.totalSpeed / activeTrip.speedCount) * 100) / 100
        : 0;

    const batteryConsumed = activeTrip.initialBattery
      ? Math.max(0, activeTrip.initialBattery - (payload.batteryLevel || activeTrip.initialBattery))
      : 0;
    const fuelConsumed = activeTrip.initialFuel
      ? Math.max(0, activeTrip.initialFuel - (payload.fuelLevel || activeTrip.initialFuel))
      : 0;

    const finalizedTrip = await this.prisma.trip.update({
      where: { id: activeTrip.tripId },
      data: {
        endTime: eventTime,
        endLatitude: payload.latitude,
        endLongitude: payload.longitude,
        distance: Math.round(activeTrip.distance * 100) / 100,
        duration: durationSeconds,
        averageSpeed: avgSpeed,
        maximumSpeed: activeTrip.maxSpeed,
        idleDuration: activeTrip.idleSeconds,
        batteryConsumed: Math.round(batteryConsumed * 100) / 100,
        fuelConsumed: Math.round(fuelConsumed * 100) / 100,
        tripStatus: TripStatus.COMPLETED,
      },
    });

    await this.redisService.del(cacheKey);

    this.logger.log(
      `Automatic TRIP COMPLETED [${finalizedTrip.tripNumber}]: distance=${finalizedTrip.distance}km, duration=${finalizedTrip.duration}s`,
    );

    const kafkaPayload: TripEventPayload = {
      tripId: finalizedTrip.id,
      tripNumber: finalizedTrip.tripNumber,
      vehicleId: payload.vehicleId,
      fleetId: payload.fleetId,
      driverId: activeTrip.driverId,
      startTime: activeTrip.startTime,
      endTime: eventTime.toISOString(),
      distance: finalizedTrip.distance,
      duration: finalizedTrip.duration,
      averageSpeed: finalizedTrip.averageSpeed,
      status: TripStatus.COMPLETED,
    };
    await this.kafkaProducer.emit(KAFKA_TOPICS.TRIP_COMPLETED, kafkaPayload);
  }

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
