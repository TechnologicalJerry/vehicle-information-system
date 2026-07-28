import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, BehaviourEventRepository } from '@app/database';
import { KafkaProducerService } from '@app/kafka';
import { BehaviourEventType, BEHAVIOUR_CONSTANTS } from '@app/common';
import { KAFKA_TOPICS, TelemetryProcessedEvent, DriverBehaviourEventPayload } from '@app/events';

interface DetectedBehaviour {
  eventType: BehaviourEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata: Record<string, any>;
}

@Injectable()
export class BehaviourDetectorEngine {
  private readonly logger = new Logger(BehaviourDetectorEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly behaviourEventRepository: BehaviourEventRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async evaluateTelemetry(payload: TelemetryProcessedEvent): Promise<void> {
    // Lookup active driver for vehicle
    const driverAssignment = await this.prisma.driverAssignment.findFirst({
      where: { vehicleId: payload.vehicleId, status: 'ACTIVE' },
    });

    const driverId = driverAssignment?.driverId;
    const detectedList = this.detectEvents(payload);

    for (const item of detectedList) {
      await this.recordBehaviourEvent(payload, driverId, item);
    }
  }

  private detectEvents(payload: TelemetryProcessedEvent): DetectedBehaviour[] {
    const events: DetectedBehaviour[] = [];

    // 1. Overspeeding
    if (payload.speed && payload.speed > BEHAVIOUR_CONSTANTS.OVERSPEED_THRESHOLD_KMH) {
      events.push({
        eventType: BehaviourEventType.OVERSPEED,
        severity: 'HIGH',
        metadata: { speed: payload.speed, threshold: BEHAVIOUR_CONSTANTS.OVERSPEED_THRESHOLD_KMH },
      });
    }

    // 2. High RPM / Engine Over-revving
    if (payload.rpm && payload.rpm > BEHAVIOUR_CONSTANTS.HIGH_RPM_THRESHOLD) {
      events.push({
        eventType: BehaviourEventType.HIGH_RPM,
        severity: 'MEDIUM',
        metadata: { rpm: payload.rpm, threshold: BEHAVIOUR_CONSTANTS.HIGH_RPM_THRESHOLD },
      });
    }

    // 3. Harsh Braking
    if (payload.seatbeltStatus === 'UNFASTENED' && payload.speed > 10) {
      events.push({
        eventType: BehaviourEventType.SEATBELT_VIOLATION,
        severity: 'HIGH',
        metadata: { speed: payload.speed },
      });
    }

    // 4. Door Open While Moving
    if (payload.doorStatus === 'OPEN' && payload.speed > 5) {
      events.push({
        eventType: BehaviourEventType.DOOR_OPEN_MOVING,
        severity: 'CRITICAL',
        metadata: { speed: payload.speed },
      });
    }

    return events;
  }

  private async recordBehaviourEvent(
    payload: TelemetryProcessedEvent,
    driverId: string | undefined,
    item: DetectedBehaviour,
  ): Promise<void> {
    const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

    await this.behaviourEventRepository.create({
      vehicleId: payload.vehicleId,
      driverId,
      eventType: item.eventType,
      severity: item.severity,
      latitude: payload.latitude,
      longitude: payload.longitude,
      speed: payload.speed || 0,
      timestamp,
      metadata: item.metadata,
    } as any);

    this.logger.warn(
      `Driver Behaviour Detected [${item.eventType}] for vehicle [${payload.vehicleId}] (Driver: ${driverId || 'Unassigned'})`,
    );

    const kafkaPayload: DriverBehaviourEventPayload = {
      vehicleId: payload.vehicleId,
      driverId,
      eventType: item.eventType,
      severity: item.severity,
      latitude: payload.latitude,
      longitude: payload.longitude,
      speed: payload.speed || 0,
      timestamp: timestamp.toISOString(),
    };

    await this.kafkaProducer.emit(KAFKA_TOPICS.DRIVER_BEHAVIOUR_DETECTED, kafkaPayload);

    if (item.severity === 'CRITICAL' || item.severity === 'HIGH') {
      await this.kafkaProducer.emit(KAFKA_TOPICS.DRIVER_RISK_DETECTED, kafkaPayload);
    }
  }
}
