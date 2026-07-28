import { DriverScoreCalculator } from './driver-score.calculator';
import { BehaviourEventType } from '@app/common';

describe('DriverScoreCalculator', () => {
  let calculator: DriverScoreCalculator;

  beforeEach(() => {
    calculator = new DriverScoreCalculator();
  });

  it('should return 100 overall driver score with zero safety events', () => {
    const result = calculator.calculateDriverScore([]);
    expect(result.overallScore).toBe(100);
    expect(result.safetyEventsCount).toBe(0);
  });

  it('should deduct driver score when safety violations occur', () => {
    const events = [
      { eventType: BehaviourEventType.HARSH_BRAKING },
      { eventType: BehaviourEventType.OVERSPEED },
      { eventType: BehaviourEventType.SEATBELT_VIOLATION },
    ];

    const result = calculator.calculateDriverScore(events);
    expect(result.overallScore).toBeLessThan(100);
    expect(result.brakingScore).toBe(95);
    expect(result.speedingScore).toBe(82);
    expect(result.safetyEventsCount).toBe(3);
  });
});
