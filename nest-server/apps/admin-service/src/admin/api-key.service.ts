import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '@app/database';
import { KafkaProducerService } from '@app/kafka';
import { CreateApiKeyDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper, ADMIN_CONSTANTS } from '@app/common';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createApiKey(dto: CreateApiKeyDto, ownerId?: string): Promise<ApiResponseInterface> {
    const rawSecret = `${ADMIN_CONSTANTS.API_KEY_PREFIX}${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const apiKeyRecord = await this.prisma.apiKey.create({
      data: {
        name: dto.name,
        keyHash,
        scopes: dto.scopes,
        ownerId,
        revoked: false,
      },
    });

    await this.kafkaProducer.emit(KAFKA_TOPICS.API_KEY_CREATED, {
      apiKeyId: apiKeyRecord.id,
      name: apiKeyRecord.name,
      ownerId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Generated API Key [${dto.name}] (ID: ${apiKeyRecord.id})`);

    return ResponseHelper.success(
      {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        apiKey: rawSecret, // Exposed ONCE at creation
        scopes: apiKeyRecord.scopes,
        createdAt: apiKeyRecord.createdAt,
      },
      'API Key generated successfully. Save this secret key safely as it will not be displayed again.',
      201,
    );
  }

  async findAllApiKeys(): Promise<ApiResponseInterface> {
    const keys = await this.prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
        scopes: true,
        revoked: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return ResponseHelper.success(keys);
  }

  async revokeApiKey(id: string): Promise<ApiResponseInterface> {
    const existing = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`API Key with ID ${id} not found`);
    }

    const revoked = await this.prisma.apiKey.update({
      where: { id },
      data: { revoked: true },
    });

    return ResponseHelper.success(revoked, 'API Key revoked successfully');
  }
}
