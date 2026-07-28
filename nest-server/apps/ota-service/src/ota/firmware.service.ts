import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { RedisService } from '@app/cache';
import { CreateFirmwareDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper } from '@app/common';

@Injectable()
export class FirmwareService {
  private readonly logger = new Logger(FirmwareService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async createFirmware(dto: CreateFirmwareDto): Promise<ApiResponseInterface> {
    // 1. Validate SHA-256 Checksum pattern
    if (!/^[a-fA-F0-9]{64}$/.test(dto.checksum)) {
      throw new BadRequestException('Invalid SHA-256 checksum format. Must be 64 hex characters.');
    }

    // 2. Check version uniqueness
    const existing = await this.prisma.firmware.findUnique({
      where: { version: dto.version },
    });

    if (existing) {
      throw new BadRequestException(`Firmware version ${dto.version} already exists`);
    }

    const firmware = await this.prisma.firmware.create({
      data: {
        version: dto.version,
        releaseName: dto.releaseName,
        description: dto.description,
        checksum: dto.checksum,
        size: dto.size ? BigInt(dto.size) : BigInt(0),
        releaseNotes: dto.releaseNotes,
        releaseDate: new Date(dto.releaseDate),
        supportedModels: dto.supportedModels,
        minimumVersion: dto.minimumVersion,
      },
    });

    // Serialize BigInt for JSON output & Redis caching
    const formatted = {
      ...firmware,
      size: firmware.size.toString(),
    };

    await this.redisService.set(`firmware:${dto.version}`, formatted, 86400);
    this.logger.log(`Firmware [${dto.version} - ${dto.releaseName}] created successfully`);

    return ResponseHelper.success(formatted, 'Firmware created successfully', 201);
  }

  async findAllFirmware(): Promise<ApiResponseInterface> {
    const firmwares = await this.prisma.firmware.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formatted = firmwares.map((f) => ({
      ...f,
      size: f.size.toString(),
    }));

    return ResponseHelper.success(formatted);
  }

  async findFirmwareById(id: string): Promise<ApiResponseInterface> {
    const firmware = await this.prisma.firmware.findUnique({
      where: { id },
    });

    if (!firmware) {
      throw new NotFoundException(`Firmware with ID ${id} not found`);
    }

    const formatted = {
      ...firmware,
      size: firmware.size.toString(),
    };

    return ResponseHelper.success(formatted);
  }

  async updateFirmware(id: string, data: any): Promise<ApiResponseInterface> {
    const existing = await this.prisma.firmware.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Firmware with ID ${id} not found`);
    }

    const updated = await this.prisma.firmware.update({
      where: { id },
      data,
    });

    const formatted = {
      ...updated,
      size: updated.size.toString(),
    };

    return ResponseHelper.success(formatted, 'Firmware updated successfully');
  }

  async deleteFirmware(id: string): Promise<ApiResponseInterface> {
    const existing = await this.prisma.firmware.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Firmware with ID ${id} not found`);
    }

    await this.prisma.firmware.delete({ where: { id } });
    await this.redisService.del(`firmware:${existing.version}`);

    return ResponseHelper.success(null, 'Firmware deleted successfully');
  }
}
