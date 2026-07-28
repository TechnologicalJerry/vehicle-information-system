import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MqttService } from '@app/mqtt';
import { CommandQueueEngine } from './command-queue.engine';

@Injectable()
export class CommandMqttHandler implements OnModuleInit {
  private readonly logger = new Logger(CommandMqttHandler.name);

  constructor(
    private readonly mqttService: MqttService,
    private readonly commandQueueEngine: CommandQueueEngine,
  ) {}

  async onModuleInit() {
    if (!this.mqttService || typeof this.mqttService.onMessage !== 'function') {
      this.logger.warn('MQTT Service not available, skipping command ACK listener');
      return;
    }
    // Subscribe to vehicle command ACKs
    await this.mqttService.subscribe('vehicle/+/ack');
    this.mqttService.onMessage(async (topic, payload) => {
      if (topic.includes('/ack')) {
        try {
          const message = JSON.parse(payload.toString());
          const { correlationId, status, errorMessage } = message;

          if (correlationId) {
            await this.commandQueueEngine.handleAck(correlationId, status, errorMessage);
          }
        } catch (err) {
          this.logger.error(`Error parsing MQTT ACK message on topic [${topic}]`, err);
        }
      }
    });
  }

  async publishCommand(vehicleId: string, commandData: any): Promise<void> {
    const topic = `vehicle/${vehicleId}/commands`;
    const payload = JSON.stringify(commandData);

    await this.mqttService.publish(topic, payload, { qos: 1 });
    this.logger.log(`Published remote command to MQTT topic [${topic}]`);
  }
}
