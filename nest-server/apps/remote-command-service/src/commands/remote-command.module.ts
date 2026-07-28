import { Module } from '@nestjs/common';
import { RemoteCommandController } from './remote-command.controller';
import { RemoteCommandService } from './remote-command.service';
import { CommandQueueEngine } from './command-queue.engine';
import { CommandMqttHandler } from './command-mqtt.handler';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';
import { AppMqttModule } from '@app/mqtt';

@Module({
  imports: [SharedAuthModule, DatabaseModule, RedisCacheModule, AppKafkaModule, AppMqttModule],
  controllers: [RemoteCommandController],
  providers: [RemoteCommandService, CommandQueueEngine, CommandMqttHandler],
  exports: [RemoteCommandService, CommandQueueEngine],
})
export class RemoteCommandModule {}
