import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { KafkaProducerService } from '@app/kafka';
import { CreateFleetDto, UpdateFleetDto, FleetQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper, FleetStatus } from '@app/common';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class FleetsService {
  private readonly logger = new Logger(FleetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createFleet(dto: CreateFleetDto): Promise<ApiResponseInterface> {
    const existingFleet = await this.prisma.fleet.findUnique({
      where: { fleetCode: dto.fleetCode.toUpperCase() },
    });

    if (existingFleet) {
      throw new ConflictException(`Fleet code '${dto.fleetCode}' is already registered`);
    }

    if (dto.managerId) {
      const manager = await this.prisma.user.findUnique({ where: { id: dto.managerId } });
      if (!manager) {
        throw new NotFoundException(`Manager with User ID ${dto.managerId} not found`);
      }
    }

    const fleet = await this.prisma.fleet.create({
      data: {
        organizationId: dto.organizationId,
        fleetCode: dto.fleetCode.toUpperCase(),
        fleetName: dto.fleetName,
        description: dto.description,
        managerId: dto.managerId,
        metadata: dto.metadata || {},
        status: FleetStatus.ACTIVE,
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    this.logger.log(`Fleet created: [${fleet.fleetCode}] - ${fleet.fleetName}`);
    await this.kafkaProducer.emit(KAFKA_TOPICS.FLEET_CREATED, {
      fleetId: fleet.id,
      fleetCode: fleet.fleetCode,
      fleetName: fleet.fleetName,
      organizationId: fleet.organizationId,
      managerId: fleet.managerId,
      createdAt: fleet.createdAt.toISOString(),
    });

    return ResponseHelper.success(fleet, 'Fleet created successfully', 201);
  }

  async findAll(query: FleetQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    if (query.search) {
      where.OR = [
        { fleetCode: { contains: query.search, mode: 'insensitive' } },
        { fleetName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [fleets, totalItems] = await Promise.all([
      this.prisma.fleet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { vehicles: true },
          },
        },
      }),
      this.prisma.fleet.count({ where }),
    ]);

    const formattedFleets = fleets.map((f) => ({
      ...f,
      totalVehicles: f._count.vehicles,
    }));

    return ResponseHelper.success(formattedFleets, 'Fleets fetched successfully', 200, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }

  async findById(id: string): Promise<ApiResponseInterface> {
    const fleet = await this.prisma.fleet.findFirst({
      where: { id, deletedAt: null },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        vehicles: {
          take: 10,
          select: {
            id: true,
            vin: true,
            registrationNumber: true,
            manufacturer: true,
            model: true,
            status: true,
          },
        },
        _count: {
          select: { vehicles: true },
        },
      },
    });

    if (!fleet) {
      throw new NotFoundException(`Fleet with ID ${id} not found`);
    }

    return ResponseHelper.success({
      ...fleet,
      totalVehicles: fleet._count.vehicles,
    });
  }

  async updateFleet(id: string, dto: UpdateFleetDto): Promise<ApiResponseInterface> {
    const fleet = await this.prisma.fleet.findFirst({
      where: { id, deletedAt: null },
    });

    if (!fleet) {
      throw new NotFoundException(`Fleet with ID ${id} not found`);
    }

    if (dto.managerId) {
      const manager = await this.prisma.user.findUnique({ where: { id: dto.managerId } });
      if (!manager) {
        throw new NotFoundException(`Manager with User ID ${dto.managerId} not found`);
      }
    }

    const updatedFleet = await this.prisma.fleet.update({
      where: { id },
      data: {
        fleetName: dto.fleetName,
        description: dto.description,
        status: dto.status,
        managerId: dto.managerId,
        metadata: dto.metadata
          ? { ...((fleet.metadata as object) || {}), ...dto.metadata }
          : undefined,
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    this.logger.log(`Fleet updated: [${updatedFleet.fleetCode}]`);
    await this.kafkaProducer.emit(KAFKA_TOPICS.FLEET_UPDATED, {
      fleetId: updatedFleet.id,
      fleetCode: updatedFleet.fleetCode,
      status: updatedFleet.status,
      updatedAt: updatedFleet.updatedAt.toISOString(),
    });

    return ResponseHelper.success(updatedFleet, 'Fleet updated successfully');
  }

  async deleteFleet(id: string): Promise<ApiResponseInterface> {
    const fleet = await this.prisma.fleet.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { vehicles: true } },
      },
    });

    if (!fleet) {
      throw new NotFoundException(`Fleet with ID ${id} not found`);
    }

    // Soft delete fleet
    await this.prisma.fleet.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: FleetStatus.DECOMMISSIONED,
      },
    });

    this.logger.log(`Fleet soft deleted: [${fleet.fleetCode}]`);
    await this.kafkaProducer.emit(KAFKA_TOPICS.FLEET_DELETED, {
      fleetId: fleet.id,
      fleetCode: fleet.fleetCode,
      deletedAt: new Date().toISOString(),
    });

    return ResponseHelper.success(null, 'Fleet deleted successfully');
  }

  async getStatistics(): Promise<ApiResponseInterface> {
    const [totalFleets, activeFleets, totalVehicles, vehiclesByStatus] = await Promise.all([
      this.prisma.fleet.count({ where: { deletedAt: null } }),
      this.prisma.fleet.count({ where: { status: FleetStatus.ACTIVE, deletedAt: null } }),
      this.prisma.vehicle.count({ where: { deletedAt: null } }),
      this.prisma.vehicle.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { deletedAt: null },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    vehiclesByStatus.forEach((item) => {
      statusCounts[item.status] = item._count.status;
    });

    return ResponseHelper.success({
      fleets: {
        total: totalFleets,
        active: activeFleets,
        inactive: totalFleets - activeFleets,
      },
      vehicles: {
        total: totalVehicles,
        active: statusCounts['ACTIVE'] || 0,
        pending: statusCounts['PENDING'] || 0,
        maintenance: statusCounts['MAINTENANCE'] || 0,
        retired: statusCounts['RETIRED'] || 0,
        inactive: statusCounts['INACTIVE'] || 0,
      },
      fleetUtilisation:
        totalVehicles > 0 ? ((statusCounts['ACTIVE'] || 0) / totalVehicles) * 100 : 0,
    });
  }
}
