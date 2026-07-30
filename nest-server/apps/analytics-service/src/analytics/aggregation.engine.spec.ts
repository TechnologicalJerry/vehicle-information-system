import { AggregationEngine } from './aggregation.engine';

describe('AggregationEngine', () => {
  let engine: AggregationEngine;
  let prismaMock: any;
  let statRepoMock: any;
  let redisMock: any;

  beforeEach(() => {
    prismaMock = {
      vehicle: {
        count: jest.fn().mockImplementation((args?: any) => {
          if (args?.where?.status === 'ACTIVE') return Promise.resolve(80);
          if (args?.where?.status === 'MAINTENANCE') return Promise.resolve(10);
          return Promise.resolve(100);
        }),
      },
      fleet: { count: jest.fn().mockResolvedValue(5) },
      trip: { count: jest.fn().mockResolvedValue(500) },
      dtc: { count: jest.fn().mockResolvedValue(12) },
      remoteCommand: { count: jest.fn().mockResolvedValue(150) },
      otaDeployment: { count: jest.fn().mockResolvedValue(45) },
    };

    statRepoMock = {
      create: jest.fn(),
    };

    redisMock = {
      set: jest.fn(),
    };

    engine = new AggregationEngine(prismaMock, statRepoMock, redisMock);
  });

  it('should aggregate executive dashboard metrics correctly', async () => {
    const metrics = await engine.aggregateExecutiveDashboard();

    expect(metrics.totalVehicles).toBe(100);
    expect(metrics.activeVehicles).toBe(80);
    expect(metrics.fleetUtilizationPercentage).toBe(80.0);
    expect(metrics.totalTrips).toBe(500);
    expect(redisMock.set).toHaveBeenCalled();
  });
});
