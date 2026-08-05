import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { MqttService } from './mqtt.service';

@Injectable()
export class MqttHealthIndicator extends HealthIndicator {
  constructor(private readonly mqttService: MqttService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = this.mqttService.isHealthy();
    if (isHealthy) {
      return this.getStatus(key, true);
    } else {
      throw new HealthCheckError('MQTT Broker is disconnected', this.getStatus(key, false));
    }
  }
}
