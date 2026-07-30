import { FeatureFlagService } from './feature-flag.service';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let prismaMock: any;
  let redisMock: any;
  let kafkaMock: any;

  beforeEach(() => {
    prismaMock = {
      featureFlag: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    kafkaMock = {
      emit: jest.fn(),
    };

    service = new FeatureFlagService(prismaMock, redisMock, kafkaMock);
  });

  it('should evaluate feature flag state correctly', async () => {
    redisMock.get.mockResolvedValue({ key: 'new_ui', enabled: true, rolloutPercentage: 100 });

    const isEnabled = await service.isFeatureEnabled('new_ui');
    expect(isEnabled).toBe(true);
  });
});
