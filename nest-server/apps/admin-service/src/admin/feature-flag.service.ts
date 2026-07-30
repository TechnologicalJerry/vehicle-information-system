import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { CreateFeatureFlagDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper } from '@app/common';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createFeatureFlag(dto: CreateFeatureFlagDto): Promise<ApiResponseInterface> {
    const existing = await this.prisma.featureFlag.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new BadRequestException(`Feature flag [${dto.key}] already exists`);
    }

    const flag = await this.prisma.featureFlag.create({
      data: {
        key: dto.key,
        enabled: dto.enabled,
        rolloutPercentage: dto.rolloutPercentage ?? 100,
        environment: dto.environment || 'production',
        description: dto.description,
      },
    });

    await this.redisService.set(`feature_flag:${flag.key}`, flag, 3600);
    await this.kafkaProducer.emit(KAFKA_TOPICS.FEATURE_FLAG_UPDATED, flag);

    this.logger.log(`Created Feature Flag [${flag.key}] (Enabled: ${flag.enabled})`);
    return ResponseHelper.success(flag, 'Feature flag created successfully', 201);
  }

  async isFeatureEnabled(key: string, contextId?: string): Promise<boolean> {
    const cached = await this.redisService.get<any>(`feature_flag:${key}`);
    let flag = cached;

    if (!flag) {
      flag = await this.prisma.featureFlag.findUnique({ where: { key } });
      if (flag) {
        await this.redisService.set(`feature_flag:${key}`, flag, 3600);
      }
    }

    if (!flag || !flag.enabled) return false;

    // Percentage rollout check if contextId is supplied
    if (contextId && flag.rolloutPercentage < 100) {
      const hash = this.simpleHash(`${key}:${contextId}`);
      return hash % 100 < flag.rolloutPercentage;
    }

    return true;
  }

  async findAllFlags(): Promise<ApiResponseInterface> {
    const flags = await this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
    return ResponseHelper.success(flags);
  }

  async updateFeatureFlag(
    id: string,
    updates: Partial<CreateFeatureFlagDto>,
  ): Promise<ApiResponseInterface> {
    const existing = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }

    const updated = await this.prisma.featureFlag.update({
      where: { id },
      data: updates,
    });

    await this.redisService.set(`feature_flag:${updated.key}`, updated, 3600);
    await this.kafkaProducer.emit(KAFKA_TOPICS.FEATURE_FLAG_UPDATED, updated);

    return ResponseHelper.success(updated, 'Feature flag updated successfully');
  }

  async deleteFeatureFlag(id: string): Promise<ApiResponseInterface> {
    const existing = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }

    await this.prisma.featureFlag.delete({ where: { id } });
    await this.redisService.del(`feature_flag:${existing.key}`);

    return ResponseHelper.success(null, 'Feature flag deleted');
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
