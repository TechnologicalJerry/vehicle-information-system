import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, DiagnosticEventRepository } from '@app/database';
import { KafkaProducerService } from '@app/kafka';
import { DtcCategory, DtcSeverity, DtcStatus, DIAGNOSTIC_CONSTANTS } from '@app/common';
import { KAFKA_TOPICS, TelemetryProcessedEvent, DtcEventPayload } from '@app/events';

interface DetectedRule {
  code: string;
  category: DtcCategory;
  severity: DtcSeverity;
  title: string;
  description: string;
}

@Injectable()
export class DtcDetectorEngine {
  private readonly logger = new Logger(DtcDetectorEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly diagnosticEventRepository: DiagnosticEventRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async evaluateTelemetry(payload: TelemetryProcessedEvent): Promise<void> {
    const rules = this.evaluateRules(payload);

    for (const rule of rules) {
      await this.handleDtcDetection(payload, rule);
    }
  }

  private evaluateRules(payload: TelemetryProcessedEvent): DetectedRule[] {
    const rules: DetectedRule[] = [];

    // Rule 1: Engine Coolant Over Temperature
    if (
      (payload.coolantTemperature &&
        payload.coolantTemperature > DIAGNOSTIC_CONSTANTS.CRITICAL_COOLANT_TEMP_CELSIUS) ||
      (payload.engineTemperature &&
        payload.engineTemperature > DIAGNOSTIC_CONSTANTS.CRITICAL_ENGINE_TEMP_CELSIUS)
    ) {
      rules.push({
        code: 'P0217',
        category: DtcCategory.COOLING,
        severity: DtcSeverity.CRITICAL,
        title: 'Engine Coolant Over Temperature',
        description: `Coolant temp (${payload.coolantTemperature}°C) or Engine temp (${payload.engineTemperature}°C) exceeded critical limit`,
      });
    }

    // Rule 2: Low System Voltage / Battery
    if (
      (payload.batteryVoltage &&
        payload.batteryVoltage < DIAGNOSTIC_CONSTANTS.LOW_BATTERY_VOLTAGE) ||
      (payload.batteryLevel && payload.batteryLevel < 15)
    ) {
      rules.push({
        code: 'P0562',
        category: DtcCategory.BATTERY,
        severity: DtcSeverity.HIGH,
        title: 'System Low Voltage Warning',
        description: `Battery voltage (${payload.batteryVoltage}V) or level (${payload.batteryLevel}%) dropped below threshold`,
      });
    }

    // Rule 3: Low Engine Oil Pressure
    if (payload.oilPressure && payload.oilPressure < DIAGNOSTIC_CONSTANTS.LOW_OIL_PRESSURE_PSI) {
      rules.push({
        code: 'P0522',
        category: DtcCategory.ENGINE,
        severity: DtcSeverity.HIGH,
        title: 'Low Engine Oil Pressure Sensor Circuit Low',
        description: `Oil pressure (${payload.oilPressure} PSI) dropped below minimum safe limit`,
      });
    }

    // Rule 4: Tyre Pressure Abnormal
    const tyrePressures = [
      payload.tyrePressureFrontLeft,
      payload.tyrePressureFrontRight,
      payload.tyrePressureRearLeft,
      payload.tyrePressureRearRight,
    ].filter((p) => p !== undefined) as number[];

    if (
      tyrePressures.some(
        (p) =>
          p < DIAGNOSTIC_CONSTANTS.MIN_TYRE_PRESSURE_PSI ||
          p > DIAGNOSTIC_CONSTANTS.MAX_TYRE_PRESSURE_PSI,
      )
    ) {
      rules.push({
        code: 'C0073',
        category: DtcCategory.TYRE,
        severity: DtcSeverity.MEDIUM,
        title: 'Tyre Pressure Out of Range',
        description: 'One or more tyre pressures outside recommended 26-40 PSI boundary',
      });
    }

    // Rule 5: Door Open While Moving
    if (payload.doorStatus === 'OPEN' && payload.speed > 5) {
      rules.push({
        code: 'B0001',
        category: DtcCategory.UNKNOWN,
        severity: DtcSeverity.HIGH,
        title: 'Door Open Warning While Vehicle Moving',
        description: `Vehicle moving at ${payload.speed} km/h with door status OPEN`,
      });
    }

    return rules;
  }

  private async handleDtcDetection(
    payload: TelemetryProcessedEvent,
    rule: DetectedRule,
  ): Promise<void> {
    const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

    const existingDtc = await this.prisma.dtc.findFirst({
      where: {
        vehicleId: payload.vehicleId,
        code: rule.code,
        status: DtcStatus.ACTIVE,
      },
    });

    let dtcId: string;

    if (existingDtc) {
      const updated = await this.prisma.dtc.update({
        where: { id: existingDtc.id },
        data: {
          lastDetectedAt: timestamp,
          occurrenceCount: { increment: 1 },
        },
      });
      dtcId = updated.id;
    } else {
      const created = await this.prisma.dtc.create({
        data: {
          vehicleId: payload.vehicleId,
          fleetId: payload.fleetId,
          code: rule.code,
          category: rule.category,
          severity: rule.severity,
          title: rule.title,
          description: rule.description,
          status: DtcStatus.ACTIVE,
          firstDetectedAt: timestamp,
          lastDetectedAt: timestamp,
          occurrenceCount: 1,
        },
      });
      dtcId = created.id;
    }

    // Record MongoDB diagnostic event log
    await this.diagnosticEventRepository.create({
      vehicleId: payload.vehicleId,
      fleetId: payload.fleetId,
      code: rule.code,
      category: rule.category,
      severity: rule.severity,
      timestamp,
      telemetryId: payload.telemetryId,
      metrics: {
        speed: payload.speed,
        coolantTemp: payload.coolantTemperature,
        engineTemp: payload.engineTemperature,
        oilPressure: payload.oilPressure,
        batteryVoltage: payload.batteryVoltage,
      },
    } as any);

    this.logger.warn(
      `DTC DETECTED [${rule.code} - ${rule.title}] for vehicle [${payload.vehicleId}]`,
    );

    const kafkaPayload: DtcEventPayload = {
      dtcId,
      vehicleId: payload.vehicleId,
      fleetId: payload.fleetId,
      code: rule.code,
      category: rule.category,
      severity: rule.severity,
      title: rule.title,
      status: DtcStatus.ACTIVE,
      detectedAt: timestamp.toISOString(),
    };

    await this.kafkaProducer.emit(KAFKA_TOPICS.DIAGNOSTIC_DETECTED, kafkaPayload);
  }
}
