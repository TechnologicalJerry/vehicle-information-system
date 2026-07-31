import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { TemplateService } from './template.service';
import { PreferencesService } from './preferences.service';
import { DeliveryDispatcherEngine } from './delivery-dispatcher.engine';
import { NotificationKafkaConsumer } from './notification.consumer';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';

@Module({
  imports: [SharedAuthModule, DatabaseModule, RedisCacheModule, AppKafkaModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    TemplateService,
    PreferencesService,
    DeliveryDispatcherEngine,
    NotificationKafkaConsumer,
  ],
  exports: [NotificationService, TemplateService, PreferencesService, DeliveryDispatcherEngine],
})
export class NotificationModule {}
