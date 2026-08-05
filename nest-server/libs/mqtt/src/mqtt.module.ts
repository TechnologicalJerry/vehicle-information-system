import { Global, Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { MqttPublisherService } from './mqtt.publisher';
import { MqttHealthIndicator } from './mqtt.health';

@Global()
@Module({
  providers: [MqttService, MqttPublisherService, MqttHealthIndicator],
  exports: [MqttService, MqttPublisherService, MqttHealthIndicator],
})
export class AppMqttModule {}
