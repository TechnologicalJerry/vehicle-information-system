import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('MQTT_URL', 'mqtt://localhost:1883');
    const clientId = this.configService.get<string>('MQTT_CLIENT_ID', 'vis-mqtt');
    const username = this.configService.get<string>('MQTT_USERNAME');
    const password = this.configService.get<string>('MQTT_PASSWORD');

    this.client = mqtt.connect(url, {
      clientId,
      username,
      password,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
    });

    this.client.on('connect', () => this.logger.log('Connected to MQTT Broker'));
    this.client.on('error', (err) => this.logger.error('MQTT Client Error', err));
    this.client.on('reconnect', () => this.logger.warn('Reconnecting to MQTT Broker...'));
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end();
    }
  }

  getClient(): mqtt.MqttClient {
    return this.client;
  }

  async publish(topic: string, message: any, options?: mqtt.IClientPublishOptions): Promise<void> {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, options || {}, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  subscribe(
    topic: string | string[],
    options?: mqtt.IClientSubscribeOptions,
  ): Promise<mqtt.ISubscriptionGrant[]> {
    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, options || {}, (err, granted) => {
        if (err) return reject(err);
        resolve(granted);
      });
    });
  }

  onMessage(handler: (topic: string, payload: Buffer) => void): void {
    if (this.client) {
      this.client.on('message', (topic, payload) => {
        handler(topic, payload);
      });
    }
  }

  isHealthy(): boolean {
    return this.client ? this.client.connected : false;
  }
}
