import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService, TripRouteRepository } from '@app/database';
import { KafkaProducerService } from '@app/kafka';
import { StartTripDto, EndTripDto, TripQueryDto, TripStatsQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper, TripStatus } from '@app/common';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tripRouteRepository: TripRouteRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async startTrip(dto: StartTripDto): Promise<ApiResponseInterface> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, deletedAt: null },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${dto.vehicleId} not found`);
    }

    const tripNumber = `TRIP-MANUAL-${Date.now().toString().slice(-6)}`;
    const startTime = new Date();

    const trip = await this.prisma.trip.create({
      data: {
        vehicleId: dto.vehicleId,
        fleetId: dto.fleetId || vehicle.fleetId,
        driverId: dto.driverId,
        tripNumber,
        startTime,
        startLatitude: dto.startLatitude,
        startLongitude: dto.startLongitude,
        tripStatus: TripStatus.IN_PROGRESS,
      },
      include: {
        vehicle: {
          select: { vin: true, registrationNumber: true, manufacturer: true, model: true },
        },
        driver: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    this.logger.log(`Manual TRIP STARTED [${trip.tripNumber}] for vehicle [${dto.vehicleId}]`);
    await this.kafkaProducer.emit(KAFKA_TOPICS.TRIP_STARTED, {
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      vehicleId: trip.vehicleId,
      fleetId: trip.fleetId,
      driverId: trip.driverId,
      startTime: trip.startTime.toISOString(),
      status: trip.tripStatus,
    });

    return ResponseHelper.success(trip, 'Trip started successfully', 201);
  }

  async endTrip(tripId: string, dto: EndTripDto): Promise<ApiResponseInterface> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException(`Trip with ID ${tripId} not found`);

    if (trip.tripStatus !== TripStatus.IN_PROGRESS) {
      throw new BadRequestException(`Trip is already ${trip.tripStatus}`);
    }

    const endTime = new Date();
    const durationSeconds = Math.max(
      0,
      Math.floor((endTime.getTime() - trip.startTime.getTime()) / 1000),
    );

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        endTime,
        endLatitude: dto.endLatitude,
        endLongitude: dto.endLongitude,
        distance: dto.distance !== undefined ? dto.distance : trip.distance,
        duration: durationSeconds,
        tripStatus: TripStatus.COMPLETED,
      },
      include: {
        vehicle: { select: { vin: true, registrationNumber: true } },
      },
    });

    this.logger.log(`Trip completed [${updatedTrip.tripNumber}]: duration=${durationSeconds}s`);
    await this.kafkaProducer.emit(KAFKA_TOPICS.TRIP_COMPLETED, {
      tripId: updatedTrip.id,
      tripNumber: updatedTrip.tripNumber,
      vehicleId: updatedTrip.vehicleId,
      fleetId: updatedTrip.fleetId,
      endTime: endTime.toISOString(),
      distance: updatedTrip.distance,
      duration: updatedTrip.duration,
      status: updatedTrip.tripStatus,
    });

    return ResponseHelper.success(updatedTrip, 'Trip completed successfully');
  }

  async findAll(query: TripQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.fleetId) where.fleetId = query.fleetId;
    if (query.driverId) where.driverId = query.driverId;
    if (query.tripStatus) where.tripStatus = query.tripStatus;

    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) where.startTime.gte = new Date(query.startDate);
      if (query.endDate) where.startTime.lte = new Date(query.endDate);
    }

    const [trips, totalItems] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          vehicle: {
            select: {
              id: true,
              vin: true,
              registrationNumber: true,
              manufacturer: true,
              model: true,
            },
          },
          fleet: { select: { id: true, fleetCode: true, fleetName: true } },
          driver: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.trip.count({ where }),
    ]);

    return ResponseHelper.success(trips, 'Trips fetched successfully', 200, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }

  async findById(id: string): Promise<ApiResponseInterface> {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            vin: true,
            registrationNumber: true,
            manufacturer: true,
            model: true,
          },
        },
        fleet: { select: { id: true, fleetCode: true, fleetName: true } },
        driver: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    // Fetch GPS route trajectory points from MongoDB
    const routePoints = await this.tripRouteRepository.findByTripId(id);

    return ResponseHelper.success({
      ...trip,
      routePoints,
    });
  }

  async getStatistics(query: TripStatsQueryDto): Promise<ApiResponseInterface> {
    const where: any = {};
    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) where.startTime.gte = new Date(query.startDate);
      if (query.endDate) where.startTime.lte = new Date(query.endDate);
    }

    const [totalTrips, completedTrips, inProgressTrips, aggregateData] = await Promise.all([
      this.prisma.trip.count({ where }),
      this.prisma.trip.count({ where: { ...where, tripStatus: TripStatus.COMPLETED } }),
      this.prisma.trip.count({ where: { ...where, tripStatus: TripStatus.IN_PROGRESS } }),
      this.prisma.trip.aggregate({
        where,
        _sum: {
          distance: true,
          duration: true,
          idleDuration: true,
          fuelConsumed: true,
          batteryConsumed: true,
        },
        _avg: {
          averageSpeed: true,
          maximumSpeed: true,
        },
      }),
    ]);

    return ResponseHelper.success({
      totalTrips,
      completedTrips,
      inProgressTrips,
      totalDistanceKm: Math.round((aggregateData._sum.distance || 0) * 100) / 100,
      totalDurationHours: Math.round(((aggregateData._sum.duration || 0) / 3600) * 100) / 100,
      totalIdleDurationHours:
        Math.round(((aggregateData._sum.idleDuration || 0) / 3600) * 100) / 100,
      averageSpeedKmh: Math.round((aggregateData._avg.averageSpeed || 0) * 100) / 100,
      maxSpeedKmh: Math.round((aggregateData._avg.maximumSpeed || 0) * 100) / 100,
      totalFuelConsumedLiters: Math.round((aggregateData._sum.fuelConsumed || 0) * 100) / 100,
      totalBatteryConsumedKwh: Math.round((aggregateData._sum.batteryConsumed || 0) * 100) / 100,
    });
  }
}
