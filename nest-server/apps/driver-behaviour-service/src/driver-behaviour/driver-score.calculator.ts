import { Injectable } from '@nestjs/common';
import { BehaviourEventType } from '@app/common';

export interface DriverScoreBreakdown {
  overallScore: number;
  accelerationScore: number;
  brakingScore: number;
  corneringScore: number;
  speedingScore: number;
  idlingScore: number;
  safetyEventsCount: number;
}

@Injectable()
export class DriverScoreCalculator {
  calculateDriverScore(events: Array<{ eventType: string }>): DriverScoreBreakdown {
    let accelerationScore = 100;
    let brakingScore = 100;
    let corneringScore = 100;
    let speedingScore = 100;
    let idlingScore = 100;

    events.forEach((ev) => {
      switch (ev.eventType) {
        case BehaviourEventType.HARSH_ACCELERATION:
          accelerationScore = Math.max(0, accelerationScore - 5);
          break;
        case BehaviourEventType.HARSH_BRAKING:
        case BehaviourEventType.RAPID_DECELERATION:
          brakingScore = Math.max(0, brakingScore - 5);
          break;
        case BehaviourEventType.RAPID_CORNERING:
          corneringScore = Math.max(0, corneringScore - 5);
          break;
        case BehaviourEventType.OVERSPEED:
          speedingScore = Math.max(0, speedingScore - 8);
          break;
        case BehaviourEventType.LONG_IDLING:
          idlingScore = Math.max(0, idlingScore - 4);
          break;
        case BehaviourEventType.SEATBELT_VIOLATION:
        case BehaviourEventType.DOOR_OPEN_MOVING:
          speedingScore = Math.max(0, speedingScore - 10);
          break;
      }
    });

    const overallScore = Math.round(
      accelerationScore * 0.2 +
        brakingScore * 0.25 +
        corneringScore * 0.15 +
        speedingScore * 0.3 +
        idlingScore * 0.1,
    );

    return {
      overallScore: Math.max(0, Math.min(100, overallScore)),
      accelerationScore,
      brakingScore,
      corneringScore,
      speedingScore,
      idlingScore,
      safetyEventsCount: events.length,
    };
  }
}
