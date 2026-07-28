import { Injectable } from '@nestjs/common';
import { TelemetryProcessedEvent } from '@app/events';
import { DIAGNOSTIC_CONSTANTS, DtcSeverity } from '@app/common';

export interface ComponentHealthScores {
  engineScore: number;
  batteryScore: number;
  temperatureScore: number;
  oilPressureScore: number;
  tyreScore: number;
}

export interface VehicleHealthResult {
  overallScore: number;
  componentScores: ComponentHealthScores;
  trend: 'STABLE' | 'DEGRADING' | 'CRITICAL';
  recommendations: string[];
}

@Injectable()
export class HealthScoreCalculator {
  calculateHealthScore(
    payload: TelemetryProcessedEvent,
    activeDtcs: Array<{ severity: DtcSeverity }>,
  ): VehicleHealthResult {
    const recommendations: string[] = [];

    // 1. Engine Score
    let engineScore = 100;
    if (payload.engineStatus === 'FAULT' || payload.engineStatus === 'ERROR') {
      engineScore -= 40;
      recommendations.push('Inspect engine control unit (ECU) system');
    }

    // 2. Battery Score
    let batteryScore = 100;
    if (
      payload.batteryVoltage &&
      payload.batteryVoltage < DIAGNOSTIC_CONSTANTS.LOW_BATTERY_VOLTAGE
    ) {
      batteryScore -= 30;
      recommendations.push('Check battery pack voltage and charging system');
    }
    if (payload.batteryLevel && payload.batteryLevel < 20) {
      batteryScore -= 15;
    }

    // 3. Temperature Score
    let temperatureScore = 100;
    if (
      payload.coolantTemperature &&
      payload.coolantTemperature > DIAGNOSTIC_CONSTANTS.CRITICAL_COOLANT_TEMP_CELSIUS
    ) {
      temperatureScore -= 35;
      recommendations.push('Flush coolant system and verify radiator fan operation');
    }
    if (
      payload.engineTemperature &&
      payload.engineTemperature > DIAGNOSTIC_CONSTANTS.CRITICAL_ENGINE_TEMP_CELSIUS
    ) {
      temperatureScore -= 35;
      recommendations.push('Immediate engine cooling system inspection required');
    }

    // 4. Oil Pressure Score
    let oilPressureScore = 100;
    if (payload.oilPressure && payload.oilPressure < DIAGNOSTIC_CONSTANTS.LOW_OIL_PRESSURE_PSI) {
      oilPressureScore -= 40;
      recommendations.push('Check engine oil level and oil pump pressure');
    }

    // 5. Tyre Score
    let tyreScore = 100;
    const pressures = [
      payload.tyrePressureFrontLeft,
      payload.tyrePressureFrontRight,
      payload.tyrePressureRearLeft,
      payload.tyrePressureRearRight,
    ].filter((p) => p !== undefined) as number[];

    if (pressures.some((p) => p < DIAGNOSTIC_CONSTANTS.MIN_TYRE_PRESSURE_PSI)) {
      tyreScore -= 25;
      recommendations.push('Inflate under-pressurized tyres to 32-35 PSI');
    }

    // Deduct active DTC penalties
    let dtcPenalties = 0;
    activeDtcs.forEach((dtc) => {
      if (dtc.severity === DtcSeverity.CRITICAL) dtcPenalties += 15;
      else if (dtc.severity === DtcSeverity.HIGH) dtcPenalties += 10;
      else if (dtc.severity === DtcSeverity.MEDIUM) dtcPenalties += 5;
      else if (dtc.severity === DtcSeverity.LOW) dtcPenalties += 2;
    });

    const weightedBase =
      engineScore * 0.25 +
      batteryScore * 0.2 +
      temperatureScore * 0.2 +
      oilPressureScore * 0.2 +
      tyreScore * 0.15;

    const finalOverall = Math.max(0, Math.min(100, Math.round(weightedBase - dtcPenalties)));

    let trend: 'STABLE' | 'DEGRADING' | 'CRITICAL' = 'STABLE';
    if (finalOverall < 50) trend = 'CRITICAL';
    else if (finalOverall < 75) trend = 'DEGRADING';

    return {
      overallScore: finalOverall,
      componentScores: {
        engineScore,
        batteryScore,
        temperatureScore,
        oilPressureScore,
        tyreScore,
      },
      trend,
      recommendations: Array.from(new Set(recommendations)),
    };
  }
}
