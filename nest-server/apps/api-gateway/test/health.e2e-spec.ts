import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../src/health/health.controller';
import { HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@app/database';
import { RedisHealthIndicator } from '@app/cache';
import { KafkaHealthIndicator } from '@app/kafka';
import { MqttHealthIndicator } from '@app/mqtt';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn().mockImplementation((indicators) => {
              return Promise.all(indicators.map((i) => i())).then((results) => ({
                status: 'ok',
                info: Object.assign({}, ...results),
                error: {},
                details: Object.assign({}, ...results),
              }));
            }),
          },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: { isHealthy: jest.fn().mockResolvedValue({ postgresql: { status: 'up' } }) },
        },
        {
          provide: MongooseHealthIndicator,
          useValue: { pingCheck: jest.fn().mockResolvedValue({ mongodb: { status: 'up' } }) },
        },
        {
          provide: RedisHealthIndicator,
          useValue: { isHealthy: jest.fn().mockResolvedValue({ redis: { status: 'up' } }) },
        },
        {
          provide: KafkaHealthIndicator,
          useValue: { isHealthy: jest.fn().mockResolvedValue({ kafka: { status: 'up' } }) },
        },
        {
          provide: MqttHealthIndicator,
          useValue: { isHealthy: jest.fn().mockResolvedValue({ mqtt: { status: 'up' } }) },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should run health checks', async () => {
    const res = await controller.check();
    expect(res).toBeDefined();
    expect(res.status).toBe('ok');
  });
});
