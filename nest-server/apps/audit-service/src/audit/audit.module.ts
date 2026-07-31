import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditKafkaConsumer } from './audit.consumer';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';

@Module({
  imports: [SharedAuthModule, DatabaseModule, RedisCacheModule, AppKafkaModule],
  controllers: [AuditController],
  providers: [AuditService, AuditKafkaConsumer],
  exports: [AuditService],
})
export class AuditModule {}
