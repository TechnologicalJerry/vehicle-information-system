import { Injectable, Logger } from '@nestjs/common';
import { TelemetryRepository } from '@app/database';
import { ApiResponseInterface, ResponseHelper } from '@app/common';

@Injectable()
export class TelemetryAggregationService {
  private readonly logger = new Logger(TelemetryAggregationService.name);

  constructor(private readonly telemetryRepository: TelemetryRepository) {}

  async calculateVehicleStatistics(
    vehicleId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ApiResponseInterface> {
    const records = await this.telemetryRepository.findHistoryByVehicleId(
      vehicleId,
      startDate,
      endDate,
      1000,
    );

    if (!records || records.length === 0) {
      return ResponseHelper.success(
        {
          vehicleId,
          totalEvents: 0,
          averageSpeed: 0,
          maxSpeed: 0,
          minSpeed: 0,
          averageRpm: 0,
          idleTimeMinutes: 0,
          drivingTimeMinutes: 0,
          batteryUsagePercent: 0,
          fuelConsumptionPercent: 0,
        },
        'No telemetry records found for specified range',
      );
    }

    let totalSpeed = 0;
    let maxSpeed = 0;
    let minSpeed = Infinity;
    let totalRpm = 0;
    let idleCount = 0;
    let drivingCount = 0;

    const initialBattery = records[records.length - 1].batteryLevel || 100;
    const latestBattery = records[0].batteryLevel || 100;
    const batteryUsagePercent = Math.max(0, initialBattery - latestBattery);

    const initialFuel = records[records.length - 1].fuelLevel || 100;
    const latestFuel = records[0].fuelLevel || 100;
    const fuelConsumptionPercent = Math.max(0, initialFuel - latestFuel);

    records.forEach((r) => {
      const speed = r.speed || 0;
      totalSpeed += speed;
      if (speed > maxSpeed) maxSpeed = speed;
      if (speed < minSpeed) minSpeed = speed;

      totalRpm += r.rpm || 0;

      if (speed === 0 && (r.engineStatus === 'RUNNING' || r.engineStatus === 'ON')) {
        idleCount++;
      } else if (speed > 0) {
        drivingCount++;
      }
    });

    const averageSpeed = totalSpeed / records.length;
    const averageRpm = totalRpm / records.length;

    return ResponseHelper.success({
      vehicleId,
      totalEvents: records.length,
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      maxSpeed,
      minSpeed: minSpeed === Infinity ? 0 : minSpeed,
      averageRpm: Math.round(averageRpm),
      idleTimeMinutes: idleCount,
      drivingTimeMinutes: drivingCount,
      batteryUsagePercent: Math.round(batteryUsagePercent * 100) / 100,
      fuelConsumptionPercent: Math.round(fuelConsumptionPercent * 100) / 100,
    });
  }
}
