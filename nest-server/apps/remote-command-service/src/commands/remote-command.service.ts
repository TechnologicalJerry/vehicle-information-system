import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { CommandQueueEngine } from './command-queue.engine';
import { CommandMqttHandler } from './command-mqtt.handler';
import { CreateCommandDto, CommandQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper, CommandStatus, CommandPriority } from '@app/common';
import { KAFKA_TOPICS } from '@app/events';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RemoteCommandService {
  private readonly logger = new Logger(RemoteCommandService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly commandQueueEngine: CommandQueueEngine,
    private readonly commandMqttHandler: CommandMqttHandler,
  ) {}

  async createCommand(dto: CreateCommandDto, userId?: string): Promise<ApiResponseInterface> {
    // 1. Check vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${dto.vehicleId} not found`);
    }

    const correlationId = `cmd-${uuidv4()}`;
    const priority = dto.priority || CommandPriority.MEDIUM;

    // 2. Persist Command Record
    const command = await this.prisma.remoteCommand.create({
      data: {
        vehicleId: dto.vehicleId,
        commandType: dto.commandType,
        payload: dto.payload || {},
        requestedBy: userId,
        requestSource: dto.requestSource || 'API',
        status: CommandStatus.PENDING,
        priority,
        correlationId,
      },
    });

    // 3. Enqueue and Update State to QUEUED
    await this.commandQueueEngine.enqueueCommand(command.id);

    // 4. Publish Command Payload to MQTT Topic
    await this.commandMqttHandler.publishCommand(dto.vehicleId, {
      commandId: command.id,
      correlationId,
      commandType: dto.commandType,
      payload: dto.payload || {},
      timestamp: new Date().toISOString(),
    });

    // 5. Mark SENT in State Machine
    await this.commandQueueEngine.markSent(command.id);

    // 6. Emit Kafka Event
    await this.kafkaProducer.emit(KAFKA_TOPICS.COMMAND_CREATED, {
      commandId: command.id,
      vehicleId: dto.vehicleId,
      commandType: dto.commandType,
      status: CommandStatus.SENT,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return ResponseHelper.success(command, 'Remote command sent successfully', 201);
  }

  async cancelCommand(id: string): Promise<ApiResponseInterface> {
    const command = await this.prisma.remoteCommand.findUnique({
      where: { id },
    });

    if (!command) {
      throw new NotFoundException(`Command with ID ${id} not found`);
    }

    if (
      command.status === CommandStatus.COMPLETED ||
      command.status === CommandStatus.FAILED ||
      command.status === CommandStatus.CANCELLED
    ) {
      throw new BadRequestException(`Cannot cancel command in terminal status ${command.status}`);
    }

    const updated = await this.prisma.remoteCommand.update({
      where: { id },
      data: { status: CommandStatus.CANCELLED },
    });

    await this.redisService.del(`command:pending:${command.vehicleId}`);
    return ResponseHelper.success(updated, 'Remote command cancelled successfully');
  }

  async findAllCommands(query: CommandQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.commandType) where.commandType = query.commandType;
    if (query.status) where.status = query.status;
    if (query.correlationId) where.correlationId = query.correlationId;

    const [commands, totalItems] = await Promise.all([
      this.prisma.remoteCommand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vehicle: { select: { vin: true, registrationNumber: true } } },
      }),
      this.prisma.remoteCommand.count({ where }),
    ]);

    return ResponseHelper.success(commands, 'Remote commands fetched successfully', 200, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }

  async findCommandById(id: string): Promise<ApiResponseInterface> {
    const command = await this.prisma.remoteCommand.findUnique({
      where: { id },
      include: {
        vehicle: { select: { id: true, vin: true, registrationNumber: true } },
        requester: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!command) {
      throw new NotFoundException(`Remote command with ID ${id} not found`);
    }

    return ResponseHelper.success(command);
  }

  async findVehicleCommandHistory(vehicleId: string): Promise<ApiResponseInterface> {
    const history = await this.prisma.remoteCommand.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ResponseHelper.success(history);
  }

  async getCommandStatistics(): Promise<ApiResponseInterface> {
    const [total, completed, failed, timedOut, pending] = await Promise.all([
      this.prisma.remoteCommand.count(),
      this.prisma.remoteCommand.count({ where: { status: CommandStatus.COMPLETED } }),
      this.prisma.remoteCommand.count({ where: { status: CommandStatus.FAILED } }),
      this.prisma.remoteCommand.count({ where: { status: CommandStatus.TIMED_OUT } }),
      this.prisma.remoteCommand.count({ where: { status: CommandStatus.PENDING } }),
    ]);

    const successRate = total > 0 ? Number(((completed / total) * 100).toFixed(2)) : 100.0;

    return ResponseHelper.success({
      totalCommands: total,
      completed,
      failed,
      timedOut,
      pending,
      successRatePercentage: successRate,
    });
  }
}
