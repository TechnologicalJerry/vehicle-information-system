import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService, AuditMetadataRepository } from '@app/database';
import { AuditQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper } from '@app/common';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditMetadataRepository: AuditMetadataRepository,
  ) {}

  async logAudit(data: {
    userId?: string;
    service: string;
    entityType: string;
    entityId?: string;
    action: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    correlationId?: string;
    metadata?: any;
  }): Promise<void> {
    this.logger.log(
      `Logging Immutable Audit Event [${data.action}] for Entity [${data.entityType}:${data.entityId || 'N/A'}] from Service [${data.service}]`,
    );

    const log = await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        service: data.service,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        oldValue: data.oldValue || undefined,
        newValue: data.newValue || undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        correlationId: data.correlationId,
        metadata: data.metadata || {},
        timestamp: new Date(),
      },
    });

    if (data.metadata && Object.keys(data.metadata).length > 0) {
      await this.auditMetadataRepository.create({
        auditId: log.id,
        correlationId: data.correlationId || '',
        extendedContext: data.metadata,
        recordedAt: new Date(),
      } as any);
    }
  }

  async findAllAudits(query: AuditQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.service) where.service = query.service;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.action) where.action = query.action;

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    const [logs, totalItems] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return ResponseHelper.success(logs, 'Audit logs fetched successfully', 200, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }

  async findAuditById(id: string): Promise<ApiResponseInterface> {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    const metadata = await this.auditMetadataRepository.findByAuditId(id);

    return ResponseHelper.success({
      ...log,
      extendedMetadata: metadata?.extendedContext || null,
    });
  }

  async findAuditsByEntity(entityId: string): Promise<ApiResponseInterface> {
    const logs = await this.prisma.auditLog.findMany({
      where: { entityId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return ResponseHelper.success(logs);
  }

  async findAuditsByUser(userId: string): Promise<ApiResponseInterface> {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return ResponseHelper.success(logs);
  }

  async findAuditsByService(service: string): Promise<ApiResponseInterface> {
    const logs = await this.prisma.auditLog.findMany({
      where: { service },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return ResponseHelper.success(logs);
  }

  async searchAudits(searchTerm: string): Promise<ApiResponseInterface> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: searchTerm, mode: 'insensitive' } },
          { entityType: { contains: searchTerm, mode: 'insensitive' } },
          { correlationId: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    return ResponseHelper.success(logs);
  }
}
