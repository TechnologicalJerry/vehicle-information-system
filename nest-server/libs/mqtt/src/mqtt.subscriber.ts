import { OnModuleInit, Logger } from '@nestjs/common';
import { MqttService } from './mqtt.service';

export abstract class AbstractMqttSubscriber implements OnModuleInit {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly mqttService: MqttService,
    protected readonly topics: string[],
  ) {}

  async onModuleInit() {
    await this.mqttService.subscribe(this.topics, { qos: 1 });
    const client = this.mqttService.getClient();

    client.on('message', (topic, payload) => {
      if (this.topics.some((t) => this.matchTopic(t, topic))) {
        this.handleMessage(topic, payload.toString());
      }
    });
  }

  private matchTopic(pattern: string, topic: string): boolean {
    const patternSegments = pattern.split('/');
    const topicSegments = topic.split('/');

    for (let i = 0; i < patternSegments.length; i++) {
      if (patternSegments[i] === '#') return true;
      if (patternSegments[i] !== '+' && patternSegments[i] !== topicSegments[i]) {
        return false;
      }
    }
    return patternSegments.length === topicSegments.length;
  }

  abstract handleMessage(topic: string, message: string): Promise<void>;
}
