import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FeatureFlagService } from './feature-flag.service';
import { ApiKeyService } from './api-key.service';
import { WebhookEngine } from './webhook.engine';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';

@Module({
  imports: [SharedAuthModule, DatabaseModule, RedisCacheModule, AppKafkaModule],
  controllers: [AdminController],
  providers: [AdminService, FeatureFlagService, ApiKeyService, WebhookEngine],
  exports: [AdminService, FeatureFlagService, ApiKeyService, WebhookEngine],
})
export class AdminModule {}
