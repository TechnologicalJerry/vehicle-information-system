import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import { KafkaProducerService } from '@app/kafka';
import { VinValidatorService, DateUtility } from '@app/utilities';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  AssignDriverDto,
  TransferVehicleDto,
  PairVehicleDto,
  ChangeVehicleStatusDto,
  VehicleQueryDto,
} from '@app/dto';
import {
  ApiResponseInterface,
  ResponseHelper,
  VehicleStatus,
  DriverAssignmentStatus,
  PairingStatus,
  VEHICLE_CONSTANTS,
} from '@app/common';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  // Status transition state machine map
  private readonly ALLOWED_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
    [VehicleStatus.PENDING]: [
      VehicleStatus.ACTIVE,
      VehicleStatus.RETIRED,
      VehicleStatus.DECOMMISSIONED,
    ],
    [VehicleStatus.ACTIVE]: [
      VehicleStatus.INACTIVE,
      VehicleStatus.MAINTENANCE,
      VehicleStatus.SUSPENDED,
      VehicleStatus.RETIRED,
      VehicleStatus.SOLD,
    ],
    [VehicleStatus.INACTIVE]: [
      VehicleStatus.ACTIVE,
      VehicleStatus.MAINTENANCE,
      VehicleStatus.RETIRED,
    ],
    [VehicleStatus.MAINTENANCE]: [
      VehicleStatus.ACTIVE,
      VehicleStatus.RETIRED,
      VehicleStatus.DECOMMISSIONED,
    ],
    [VehicleStatus.SUSPENDED]: [VehicleStatus.ACTIVE, VehicleStatus.DECOMMISSIONED],
    [VehicleStatus.RETIRED]: [],
    [VehicleStatus.SOLD]: [],
    [VehicleStatus.DECOMMISSIONED]: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly vinValidator: VinValidatorService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createVehicle(dto: CreateVehicleDto): Promise<ApiResponseInterface> {
    const uppercaseVin = dto.vin.toUpperCase();
    this.vinValidator.validateVin(uppercaseVin);

    const existingVin = await this.prisma.vehicle.findUnique({ where: { vin: uppercaseVin } });
    if (existingVin) {
      throw new ConflictException(`Vehicle with VIN '${uppercaseVin}' is already registered`);
    }

    const existingReg = await this.prisma.vehicle.findUnique({
      where: { registrationNumber: dto.registrationNumber.toUpperCase() },
    });
    if (existingReg) {
      throw new ConflictException(
        `Vehicle with Registration Number '${dto.registrationNumber}' is already registered`,
      );
    }

    if (dto.fleetId) {
      const fleet = await this.prisma.fleet.findUnique({ where: { id: dto.fleetId } });
      if (!fleet) {
        throw new NotFoundException(`Fleet with ID ${dto.fleetId} not found`);
      }
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        fleetId: dto.fleetId,
        vin: uppercaseVin,
        registrationNumber: dto.registrationNumber.toUpperCase(),
        chassisNumber: dto.chassisNumber,
        engineNumber: dto.engineNumber,
        manufacturer: dto.manufacturer,
        model: dto.model,
        variant: dto.variant,
        modelYear: dto.modelYear,
        colour: dto.colour,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        vehicleType: dto.vehicleType,
        batteryCapacity: dto.batteryCapacity,
        odometer: dto.odometer || 0,
        status: VehicleStatus.PENDING,
        pairingStatus: PairingStatus.PENDING,
      },
      include: { fleet: true },
    });

    this.logger.log(
      `Vehicle registered: [VIN=${vehicle.vin}] - ${vehicle.manufacturer} ${vehicle.model}`,
    );
    await this.kafkaProducer.emit(KAFKA_TOPICS.VEHICLE_CREATED, {
      vehicleId: vehicle.id,
      vin: vehicle.vin,
      registrationNumber: vehicle.registrationNumber,
      fleetId: vehicle.fleetId,
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      modelYear: vehicle.modelYear,
      status: vehicle.status,
      createdAt: vehicle.createdAt.toISOString(),
    });

    return ResponseHelper.success(vehicle, 'Vehicle registered successfully', 201);
  }

  async findAll(query: VehicleQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (query.fleetId) where.fleetId = query.fleetId;
    if (query.status) where.status = query.status;
    if (query.manufacturer)
      where.manufacturer = { contains: query.manufacturer, mode: 'insensitive' };

    if (query.search) {
      where.OR = [
        { vin: { contains: query.search, mode: 'insensitive' } },
        { registrationNumber: { contains: query.search, mode: 'insensitive' } },
        { manufacturer: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [vehicles, totalItems] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fleet: { select: { id: true, fleetCode: true, fleetName: true } },
          driverAssignments: {
            where: { status: DriverAssignmentStatus.ACTIVE },
            include: {
              driver: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return ResponseHelper.success(vehicles, 'Vehicles fetched successfully', 200, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }

  async findById(id: string): Promise<ApiResponseInterface> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
      include: {
        fleet: true,
        driverAssignments: {
          orderBy: { assignedAt: 'desc' },
          include: {
            driver: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        pairings: { orderBy: { createdAt: 'desc' }, take: 5 },
        ownershipHistory: { orderBy: { transferredAt: 'desc' }, include: { newFleet: true } },
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return ResponseHelper.success(vehicle);
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto): Promise<ApiResponseInterface> {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id, deletedAt: null } });
    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${id} not found`);

    if (dto.registrationNumber) {
      const uppercaseReg = dto.registrationNumber.toUpperCase();
      const existing = await this.prisma.vehicle.findFirst({
        where: { registrationNumber: uppercaseReg, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Registration number '${uppercaseReg}' is already assigned`);
      }
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        registrationNumber: dto.registrationNumber?.toUpperCase(),
        colour: dto.colour,
        odometer: dto.odometer,
        softwareVersion: dto.softwareVersion,
        firmwareVersion: dto.firmwareVersion,
      },
      include: { fleet: true },
    });

    this.logger.log(`Vehicle updated: [VIN=${updated.vin}]`);
    await this.kafkaProducer.emit(KAFKA_TOPICS.VEHICLE_UPDATED, {
      vehicleId: updated.id,
      vin: updated.vin,
      updatedAt: updated.updatedAt.toISOString(),
    });

    return ResponseHelper.success(updated, 'Vehicle updated successfully');
  }

  async deleteVehicle(id: string): Promise<ApiResponseInterface> {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id, deletedAt: null } });
    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${id} not found`);

    await this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date(), status: VehicleStatus.DECOMMISSIONED },
    });

    // Release any active driver assignments
    await this.prisma.driverAssignment.updateMany({
      where: { vehicleId: id, status: DriverAssignmentStatus.ACTIVE },
      data: { releasedAt: new Date(), status: DriverAssignmentStatus.RELEASED },
    });

    this.logger.log(`Vehicle soft deleted: [VIN=${vehicle.vin}]`);
    await this.kafkaProducer.emit(KAFKA_TOPICS.VEHICLE_DELETED, {
      vehicleId: vehicle.id,
      vin: vehicle.vin,
      deletedAt: new Date().toISOString(),
    });

    return ResponseHelper.success(null, 'Vehicle deleted successfully');
  }

  async assignDriver(vehicleId: string, dto: AssignDriverDto): Promise<ApiResponseInterface> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);

    const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
    if (!driver) throw new NotFoundException(`Driver with User ID ${dto.driverId} not found`);

    // Terminate existing active driver assignment for this vehicle (Ensures ONLY 1 active driver)
    await this.prisma.driverAssignment.updateMany({
      where: { vehicleId, status: DriverAssignmentStatus.ACTIVE },
      data: { releasedAt: new Date(), status: DriverAssignmentStatus.RELEASED },
    });

    const assignment = await this.prisma.driverAssignment.create({
      data: {
        vehicleId,
        driverId: dto.driverId,
        status: DriverAssignmentStatus.ACTIVE,
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    this.logger.log(`Driver assigned to vehicle [VIN=${vehicle.vin}]: [driverId=${dto.driverId}]`);
    await this.kafkaProducer.emit(KAFKA_TOPICS.VEHICLE_ASSIGNED, {
      vehicleId,
      driverId: dto.driverId,
      assignedAt: assignment.assignedAt.toISOString(),
    });

    return ResponseHelper.success(assignment, 'Driver assigned successfully');
  }

  async removeDriver(vehicleId: string): Promise<ApiResponseInterface> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);

    await this.prisma.driverAssignment.updateMany({
      where: { vehicleId, status: DriverAssignmentStatus.ACTIVE },
      data: { releasedAt: new Date(), status: DriverAssignmentStatus.RELEASED },
    });

    this.logger.log(`Active driver removed from vehicle [VIN=${vehicle.vin}]`);
    return ResponseHelper.success(null, 'Active driver removed successfully');
  }

  async transferVehicle(vehicleId: string, dto: TransferVehicleDto): Promise<ApiResponseInterface> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);

    const newFleet = await this.prisma.fleet.findUnique({ where: { id: dto.newFleetId } });
    if (!newFleet)
      throw new NotFoundException(`Destination Fleet with ID ${dto.newFleetId} not found`);

    const previousFleetId = vehicle.fleetId;

    await this.prisma.$transaction([
      this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { fleetId: dto.newFleetId },
      }),
      this.prisma.vehicleOwnershipHistory.create({
        data: {
          vehicleId,
          previousFleetId,
          newFleetId: dto.newFleetId,
          reason: dto.reason,
        },
      }),
    ]);

    this.logger.log(`Vehicle transferred [VIN=${vehicle.vin}] to Fleet [${newFleet.fleetCode}]`);
    await this.kafkaProducer.emit(KAFKA_TOPICS.VEHICLE_TRANSFERRED, {
      vehicleId,
      previousFleetId,
      newFleetId: dto.newFleetId,
      transferredAt: new Date().toISOString(),
    });

    return ResponseHelper.success(
      null,
      `Vehicle transferred to fleet '${newFleet.fleetName}' successfully`,
    );
  }

  async pairVehicle(vehicleId: string, dto: PairVehicleDto): Promise<ApiResponseInterface> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);

    if (dto.pairingCode) {
      // Validate pairing code
      const activePairing = await this.prisma.vehiclePairing.findFirst({
        where: {
          vehicleId,
          pairingCode: dto.pairingCode,
          status: PairingStatus.PENDING,
        },
      });

      if (!activePairing || new Date() > activePairing.expiresAt) {
        throw new BadRequestException('Invalid or expired pairing code');
      }

      await this.prisma.$transaction([
        this.prisma.vehiclePairing.update({
          where: { id: activePairing.id },
          data: { status: PairingStatus.ACTIVE, pairedAt: new Date() },
        }),
        this.prisma.vehicle.update({
          where: { id: vehicleId },
          data: { pairingStatus: PairingStatus.ACTIVE },
        }),
      ]);

      this.logger.log(`Vehicle telemetry paired successfully: [VIN=${vehicle.vin}]`);
      await this.kafkaProducer.emit(KAFKA_TOPICS.VEHICLE_PAIRED, {
        vehicleId,
        pairingCode: dto.pairingCode,
        pairedAt: new Date().toISOString(),
      });

      return ResponseHelper.success(null, 'Vehicle paired successfully');
    } else {
      // Generate 6-digit pairing code
      const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = DateUtility.addMinutes(
        new Date(),
        VEHICLE_CONSTANTS.PAIRING_CODE_EXPIRATION_MINUTES,
      );

      const pairingRecord = await this.prisma.vehiclePairing.create({
        data: {
          vehicleId,
          pairingCode,
          expiresAt,
          status: PairingStatus.PENDING,
        },
      });

      return ResponseHelper.success(
        {
          pairingCode,
          expiresAt: pairingRecord.expiresAt,
        },
        'Pairing code generated successfully. Valid for 15 minutes.',
      );
    }
  }

  async unpairVehicle(vehicleId: string): Promise<ApiResponseInterface> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);

    await this.prisma.$transaction([
      this.prisma.vehiclePairing.updateMany({
        where: { vehicleId, status: PairingStatus.ACTIVE },
        data: { status: PairingStatus.REVOKED, revokedAt: new Date() },
      }),
      this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { pairingStatus: PairingStatus.REVOKED },
      }),
    ]);

    this.logger.log(`Vehicle pairing revoked: [VIN=${vehicle.vin}]`);
    return ResponseHelper.success(null, 'Vehicle pairing revoked successfully');
  }

  async changeStatus(
    vehicleId: string,
    dto: ChangeVehicleStatusDto,
  ): Promise<ApiResponseInterface> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);

    const currentStatus = vehicle.status;
    const allowedNextStatuses = this.ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowedNextStatuses.includes(dto.newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${dto.newStatus}'. Allowed transitions: [${allowedNextStatuses.join(', ')}]`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: dto.newStatus },
      }),
      this.prisma.vehicleStatusHistory.create({
        data: {
          vehicleId,
          previousStatus: currentStatus,
          newStatus: dto.newStatus,
          reason: dto.reason,
        },
      }),
    ]);

    this.logger.log(
      `Vehicle status changed [VIN=${vehicle.vin}]: ${currentStatus} -> ${dto.newStatus}`,
    );
    await this.kafkaProducer.emit(KAFKA_TOPICS.VEHICLE_STATUS_CHANGED, {
      vehicleId,
      previousStatus: currentStatus,
      newStatus: dto.newStatus,
      reason: dto.reason,
      changedAt: new Date().toISOString(),
    });

    return ResponseHelper.success(
      null,
      `Vehicle status changed to '${dto.newStatus}' successfully`,
    );
  }
}
