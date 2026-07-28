import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MqttService } from '@app/mqtt';
import { OtaRolloutEngine } from './ota-rollout.engine';
import { OtaStatus } from '@app/common';

@Injectable()
export class OtaMqttHandler implements OnModuleInit {
  private readonly logger = new Logger(OtaMqttHandler.name);

  constructor(
    private readonly mqttService: MqttService,
    private readonly otaRolloutEngine: OtaRolloutEngine,
  ) {}

  async onModuleInit() {
    if (!this.mqttService || typeof this.mqttService.onMessage !== 'function') {
      this.logger.warn('MQTT Service not available, skipping OTA status listener');
      return;
    }
    // Subscribe to vehicle OTA status updates
    await this.mqttService.subscribe('vehicle/+/ota/status');
    this.mqttService.onMessage(async (topic, payload) => {
      if (topic.includes('/ota/status')) {
        try {
          const message = JSON.parse(payload.toString());
          const { deploymentId, status, failureReason } = message;

          if (deploymentId && status) {
            await this.otaRolloutEngine.updateDeploymentStatus(
              deploymentId,
              status as OtaStatus,
              failureReason,
            );
          }
        } catch (err) {
          this.logger.error(`Error parsing MQTT OTA status on topic [${topic}]`, err);
        }
      }
    });
  }

  async sendOtaManifest(vehicleId: string, otaManifest: any): Promise<void> {
    const topic = `vehicle/${vehicleId}/ota`;
    const payload = JSON.stringify(otaManifest);

    await this.mqttService.publish(topic, payload, { qos: 1 });
    this.logger.log(`Published OTA update manifest to MQTT topic [${topic}]`);
  }
}
