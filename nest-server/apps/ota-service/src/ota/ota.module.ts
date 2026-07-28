import { Module } from '@nestjs/common';
import { OtaController } from './ota.controller';
import { OtaService } from './ota.service';
import { FirmwareService } from './firmware.service';
import { OtaRolloutEngine } from './ota-rollout.engine';
import { OtaMqttHandler } from './ota-mqtt.handler';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';
import { AppMqttModule } from '@app/mqtt';

@Module({
  imports: [SharedAuthModule, DatabaseModule, RedisCacheModule, AppKafkaModule, AppMqttModule],
  controllers: [OtaController],
  providers: [OtaService, FirmwareService, OtaRolloutEngine, OtaMqttHandler],
  exports: [OtaService, FirmwareService, OtaRolloutEngine],
})
export class OtaModule {}
