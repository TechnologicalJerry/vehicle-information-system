import { HealthScoreCalculator } from './health-score.calculator';
import { DtcSeverity } from '@app/common';

describe('HealthScoreCalculator', () => {
  let calculator: HealthScoreCalculator;

  beforeEach(() => {
    calculator = new HealthScoreCalculator();
  });

  it('should return 100 overall health score for healthy vehicle telemetry', () => {
    const payload: any = {
      engineStatus: 'RUNNING',
      batteryVoltage: 400,
      batteryLevel: 90,
      coolantTemperature: 90,
      engineTemperature: 95,
      oilPressure: 35,
      tyrePressureFrontLeft: 32,
      tyrePressureFrontRight: 32,
      tyrePressureRearLeft: 32,
      tyrePressureRearRight: 32,
    };

    const result = calculator.calculateHealthScore(payload, []);
    expect(result.overallScore).toBe(100);
    expect(result.trend).toBe('STABLE');
    expect(result.recommendations.length).toBe(0);
  });

  it('should deduct health score when critical coolant temperature and DTCs are present', () => {
    const payload: any = {
      engineStatus: 'RUNNING',
      coolantTemperature: 115,
      engineTemperature: 120,
    };

    const activeDtcs = [{ severity: DtcSeverity.CRITICAL }];

    const result = calculator.calculateHealthScore(payload, activeDtcs as any);
    expect(result.overallScore).toBeLessThan(75);
    expect(result.trend).toBe('DEGRADING');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
