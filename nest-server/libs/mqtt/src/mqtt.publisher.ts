import { Injectable, Logger } from '@nestjs/common';
import { MqttService } from './mqtt.service';

@Injectable()
export class MqttPublisherService {
  private readonly logger = new Logger(MqttPublisherService.name);

  constructor(private readonly mqttService: MqttService) {}

  async publishVehicleCommand(vin: string, command: string, payload: any): Promise<void> {
    const topic = `vehicles/${vin}/commands/${command}`;
    this.logger.log(`Publishing MQTT command to [${topic}]`);
    await this.mqttService.publish(topic, payload, { qos: 1 });
  }
}
