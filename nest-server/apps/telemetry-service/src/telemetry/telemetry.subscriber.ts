import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MqttService } from '@app/mqtt';
import { TelemetryService } from './telemetry.service';

@Injectable()
export class TelemetrySubscriber implements OnModuleInit {
  private readonly logger = new Logger(TelemetrySubscriber.name);

  constructor(
    private readonly mqttService: MqttService,
    private readonly telemetryService: TelemetryService,
  ) {}

  async onModuleInit() {
    const topics = [
      'vehicle/+/telemetry',
      'vehicle/+/status',
      'vehicle/+/engine',
      'vehicle/+/battery',
      'vehicle/+/location',
      'vehicle/+/diagnostics',
      'vehicle/+/alerts',
    ];

    for (const topic of topics) {
      await this.mqttService.subscribe(topic);
    }

    if (this.mqttService && typeof this.mqttService.onMessage === 'function') {
      this.mqttService.onMessage(async (topic, payload) => {
        await this.handleMqttMessage(topic, payload);
      });
    }

    this.logger.log(`MQTT Telemetry Subscriber initialized on topics: [${topics.join(', ')}]`);
  }

  private async handleMqttMessage(topic: string, payload: Buffer) {
    try {
      const topicParts = topic.split('/');
      const vehicleId = topicParts[1];
      const messageType = topicParts[2];

      const rawJson = JSON.parse(payload.toString());

      this.logger.log(`MQTT Packet Received [${topic}]: type=${messageType}`);

      await this.telemetryService.ingest({
        vehicleId,
        source: 'MQTT',
        latitude: rawJson.latitude || rawJson.lat || 0,
        longitude: rawJson.longitude || rawJson.lng || 0,
        speed: rawJson.speed || 0,
        rpm: rawJson.rpm || 0,
        odometer: rawJson.odometer,
        fuelLevel: rawJson.fuelLevel,
        batteryLevel: rawJson.batteryLevel,
        engineStatus: rawJson.engineStatus || 'RUNNING',
        rawPayload: rawJson,
        metadata: { mqttTopic: topic, messageType },
      });
    } catch (err) {
      this.logger.error(`Error processing MQTT telemetry message on topic [${topic}]`, err);
    }
  }
}
