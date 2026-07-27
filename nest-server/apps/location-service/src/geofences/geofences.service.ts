import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { GeofenceRepository, PrismaService } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { CreateGeofenceDto, UpdateGeofenceDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper, GeofenceType } from '@app/common';
import { KAFKA_TOPICS, GeofenceEventPayload } from '@app/events';

@Injectable()
export class GeofencesService {
  private readonly logger = new Logger(GeofencesService.name);

  constructor(
    private readonly geofenceRepository: GeofenceRepository,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createGeofence(dto: CreateGeofenceDto): Promise<ApiResponseInterface> {
    const fleet = await this.prisma.fleet.findUnique({ where: { id: dto.fleetId } });
    if (!fleet) {
      throw new NotFoundException(`Fleet with ID ${dto.fleetId} not found`);
    }

    if (dto.type === GeofenceType.CIRCLE) {
      if (!dto.center || dto.center.length !== 2 || !dto.radius) {
        throw new BadRequestException('CIRCLE geofence requires center [lng, lat] and radius');
      }
    } else if (dto.type === GeofenceType.POLYGON) {
      if (!dto.polygonCoordinates || dto.polygonCoordinates.length === 0) {
        throw new BadRequestException('POLYGON geofence requires polygonCoordinates array');
      }
    }

    const geofence = await this.geofenceRepository.create({
      fleetId: dto.fleetId,
      name: dto.name,
      type: dto.type,
      center: dto.center ? { type: 'Point', coordinates: dto.center } : undefined,
      radius: dto.radius || 0,
      polygon: dto.polygonCoordinates
        ? { type: 'Polygon', coordinates: dto.polygonCoordinates }
        : undefined,
      active: dto.active !== undefined ? dto.active : true,
      metadata: dto.metadata || {},
    } as any);

    this.logger.log(`Geofence created: [${geofence.name}] for fleet [${dto.fleetId}]`);
    return ResponseHelper.success(geofence, 'Geofence created successfully', 201);
  }

  async findAll(fleetId?: string): Promise<ApiResponseInterface> {
    const filter = fleetId ? { fleetId, active: true } : { active: true };
    const geofences = await this.geofenceRepository.findAll(filter);
    return ResponseHelper.success(geofences);
  }

  async findById(id: string): Promise<ApiResponseInterface> {
    const geofence = await this.geofenceRepository.findById(id);
    if (!geofence) {
      throw new NotFoundException(`Geofence with ID ${id} not found`);
    }
    return ResponseHelper.success(geofence);
  }

  async updateGeofence(id: string, dto: UpdateGeofenceDto): Promise<ApiResponseInterface> {
    const geofence = await this.geofenceRepository.findById(id);
    if (!geofence) throw new NotFoundException(`Geofence with ID ${id} not found`);

    const updated = await this.geofenceRepository.update(id, dto as any);
    return ResponseHelper.success(updated, 'Geofence updated successfully');
  }

  async deleteGeofence(id: string): Promise<ApiResponseInterface> {
    const deleted = await this.geofenceRepository.delete(id);
    if (!deleted) throw new NotFoundException(`Geofence with ID ${id} not found`);
    return ResponseHelper.success(null, 'Geofence deleted successfully');
  }

  // Haversine formula for distance in meters between two GPS points
  isPointInCircle(
    lat: number,
    lng: number,
    centerLat: number,
    centerLng: number,
    radiusMeters: number,
  ): boolean {
    const R = 6371000; // Earth radius in meters
    const dLat = ((centerLat - lat) * Math.PI) / 180;
    const dLng = ((centerLng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((centerLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= radiusMeters;
  }

  // Ray-casting algorithm for Point-in-Polygon
  isPointInPolygon(lat: number, lng: number, ring: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];

      const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  async evaluateGeofences(
    vehicleId: string,
    fleetId: string | undefined,
    lat: number,
    lng: number,
    timestamp: Date,
  ): Promise<void> {
    if (!fleetId) return;

    const geofences = await this.geofenceRepository.findActiveByFleet(fleetId);
    if (!geofences || geofences.length === 0) return;

    for (const geofence of geofences) {
      let isInside = false;

      if (geofence.type === GeofenceType.CIRCLE && geofence.center?.coordinates) {
        const centerLng = geofence.center.coordinates[0];
        const centerLat = geofence.center.coordinates[1];
        isInside = this.isPointInCircle(lat, lng, centerLat, centerLng, geofence.radius);
      } else if (geofence.type === GeofenceType.POLYGON && geofence.polygon?.coordinates?.[0]) {
        isInside = this.isPointInPolygon(lat, lng, geofence.polygon.coordinates[0]);
      }

      const cacheKey = `vehicle:${vehicleId}:geofence:${geofence._id.toString()}`;
      const wasInside = await this.redisService.get<boolean>(cacheKey);

      if (isInside && !wasInside) {
        // Vehicle entered geofence
        await this.redisService.set(cacheKey, true, 86400);
        this.logger.warn(`Vehicle [${vehicleId}] ENTERED Geofence [${geofence.name}]`);

        const payload: GeofenceEventPayload = {
          geofenceId: geofence._id.toString(),
          geofenceName: geofence.name,
          vehicleId,
          fleetId,
          latitude: lat,
          longitude: lng,
          timestamp: timestamp.toISOString(),
          eventType: 'ENTERED',
        };
        await this.kafkaProducer.emit(KAFKA_TOPICS.GEOFENCE_ENTERED, payload);
      } else if (!isInside && wasInside) {
        // Vehicle exited geofence
        await this.redisService.del(cacheKey);
        this.logger.warn(`Vehicle [${vehicleId}] EXITED Geofence [${geofence.name}]`);

        const payload: GeofenceEventPayload = {
          geofenceId: geofence._id.toString(),
          geofenceName: geofence.name,
          vehicleId,
          fleetId,
          latitude: lat,
          longitude: lng,
          timestamp: timestamp.toISOString(),
          eventType: 'EXITED',
        };
        await this.kafkaProducer.emit(KAFKA_TOPICS.GEOFENCE_EXITED, payload);
      }
    }
  }
}
