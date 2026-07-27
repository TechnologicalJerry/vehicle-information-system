import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { ApiGatewayModule } from '../src/api-gateway.module';
import { PrismaService } from '@app/database';
import { RedisService } from '@app/cache';
import { KafkaService } from '@app/kafka';
import { MqttService } from '@app/mqtt';
import {
  createMockPrismaService,
  createMockRedisService,
  createMockKafkaService,
  createMockMqttService,
} from '@app/testing';

describe('ApiGateway (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiGatewayModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createMockPrismaService())
      .overrideProvider(RedisService)
      .useValue(createMockRedisService())
      .overrideProvider(KafkaService)
      .useValue(createMockKafkaService())
      .overrideProvider(MqttService)
      .useValue(createMockMqttService())
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: 'v1',
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health (GET) should be defined', () => {
    return request(app.getHttpServer()).get('/api/v1/health');
  });
});
