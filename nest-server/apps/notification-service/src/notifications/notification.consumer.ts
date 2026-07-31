import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaConsumerService } from '@app/kafka';
import { NotificationService } from './notification.service';
import {
  KAFKA_TOPICS,
  DtcEventPayload,
  GeofenceEventPayload,
  DriverBehaviourEventPayload,
} from '@app/events';
import { NotificationChannel, NotificationCategory, NotificationPriority } from '@app/common';

@Injectable()
export class NotificationKafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(NotificationKafkaConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    await this.kafkaConsumer.subscribe(
      'notification-service-group',
      [
        KAFKA_TOPICS.DIAGNOSTIC_DETECTED,
        KAFKA_TOPICS.GEOFENCE_ENTERED,
        KAFKA_TOPICS.GEOFENCE_EXITED,
        KAFKA_TOPICS.DRIVER_RISK_DETECTED,
        KAFKA_TOPICS.COMMAND_COMPLETED,
        KAFKA_TOPICS.OTA_COMPLETED,
      ],
      async (topic, message) => {
        try {
          const payload = JSON.parse(message.value.toString());
          await this.handleKafkaEvent(topic, payload);
        } catch (err) {
          this.logger.error(`Error consuming Kafka event on topic [${topic}]`, err);
        }
      },
    );
  }

  private async handleKafkaEvent(topic: string, payload: any): Promise<void> {
    if (topic === KAFKA_TOPICS.DIAGNOSTIC_DETECTED) {
      const dtcPayload = payload as DtcEventPayload;
      await this.notificationService.createNotification({
        vehicleId: dtcPayload.vehicleId,
        fleetId: dtcPayload.fleetId,
        channel: NotificationChannel.IN_APP,
        category: NotificationCategory.DIAGNOSTICS,
        title: `DTC Alert: ${dtcPayload.code} - ${dtcPayload.title}`,
        message: `Diagnostic trouble code ${dtcPayload.code} (${dtcPayload.severity}) detected for vehicle ${dtcPayload.vehicleId}`,
        priority: NotificationPriority.HIGH,
      });
    } else if (topic === KAFKA_TOPICS.GEOFENCE_ENTERED || topic === KAFKA_TOPICS.GEOFENCE_EXITED) {
      const geoPayload = payload as GeofenceEventPayload;
      await this.notificationService.createNotification({
        vehicleId: geoPayload.vehicleId,
        fleetId: geoPayload.fleetId,
        channel: NotificationChannel.IN_APP,
        category: NotificationCategory.GEOFENCE,
        title: `Geofence ${geoPayload.eventType}: ${geoPayload.geofenceName}`,
        message: `Vehicle ${geoPayload.vehicleId} ${geoPayload.eventType.toLowerCase()} geofence zone [${geoPayload.geofenceName}]`,
        priority: NotificationPriority.MEDIUM,
      });
    } else if (topic === KAFKA_TOPICS.DRIVER_RISK_DETECTED) {
      const driverPayload = payload as DriverBehaviourEventPayload;
      await this.notificationService.createNotification({
        userId: driverPayload.driverId,
        vehicleId: driverPayload.vehicleId,
        channel: NotificationChannel.PUSH,
        category: NotificationCategory.DRIVER_BEHAVIOUR,
        title: `Unsafe Driving Violation: ${driverPayload.eventType}`,
        message: `High risk safety event [${driverPayload.eventType}] detected at speed ${driverPayload.speed} km/h`,
        priority: NotificationPriority.HIGH,
      });
    }
  }
}
