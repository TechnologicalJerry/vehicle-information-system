import { Global, Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaProducerService } from './kafka.producer';
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaHealthIndicator } from './kafka.health';

@Global()
@Module({
  providers: [KafkaService, KafkaProducerService, KafkaConsumerService, KafkaHealthIndicator],
  exports: [KafkaService, KafkaProducerService, KafkaConsumerService, KafkaHealthIndicator],
})
export class AppKafkaModule {}
