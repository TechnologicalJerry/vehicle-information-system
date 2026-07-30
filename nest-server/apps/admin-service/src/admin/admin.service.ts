import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaProducerService } from '@app/kafka';
import { UpdateSettingDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper } from '@app/common';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async getAdminDashboard(): Promise<ApiResponseInterface> {
    const [
      totalUsers,
      totalVehicles,
      totalFleets,
      totalFeatureFlags,
      totalApiKeys,
      totalWebhooks,
      activeSystemSettings,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.vehicle.count(),
      this.prisma.fleet.count(),
      this.prisma.featureFlag.count(),
      this.prisma.apiKey.count({ where: { revoked: false } }),
      this.prisma.webhook.count({ where: { active: true } }),
      this.prisma.systemSetting.count(),
    ]);

    return ResponseHelper.success({
      platformStatus: 'OPERATIONAL',
      totalUsers,
      totalVehicles,
      totalFleets,
      totalFeatureFlags,
      totalApiKeys,
      totalWebhooks,
      activeSystemSettings,
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }

  async getSettings(): Promise<ApiResponseInterface> {
    const cached = await this.redisService.get<any>('admin:system_settings');
    if (cached) {
      return ResponseHelper.success(cached, 'System settings fetched from Redis cache');
    }

    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    await this.redisService.set('admin:system_settings', settings, 1800);
    return ResponseHelper.success(settings);
  }

  async updateSetting(dto: UpdateSettingDto): Promise<ApiResponseInterface> {
    const updated = await this.prisma.systemSetting.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        value: dto.value,
        category: dto.category || 'GENERAL',
        description: dto.description,
      },
      update: {
        value: dto.value,
        category: dto.category || 'GENERAL',
        description: dto.description,
      },
    });

    await this.redisService.del('admin:system_settings');
    await this.kafkaProducer.emit(KAFKA_TOPICS.ADMIN_SETTING_UPDATED, updated);

    this.logger.log(`Updated System Setting [${dto.key}]`);
    return ResponseHelper.success(updated, 'System setting updated successfully');
  }
}
