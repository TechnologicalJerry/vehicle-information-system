import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { KafkaProducerService } from '@app/kafka';
import { NotificationStatus } from '@app/common';
import { KAFKA_TOPICS, NotificationEventPayload } from '@app/events';

@Injectable()
export class DeliveryDispatcherEngine {
  private readonly logger = new Logger(DeliveryDispatcherEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async dispatchNotification(notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) return;

    // Simulate Multi-Channel Dispatch (Email, SMS, Push, In-App, Webhook)
    try {
      this.logger.log(
        `Dispatching Notification [${notification.id}] via [${notification.channel}] to User [${notification.userId || 'System'}]`,
      );

      const delivered = await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });

      await this.emitKafka(KAFKA_TOPICS.NOTIFICATION_DELIVERED, delivered);
    } catch (err: any) {
      this.logger.error(`Failed to deliver notification [${notificationId}]`, err);

      const failed = await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          failureReason: err.message || 'Delivery error',
        },
      });

      await this.emitKafka(KAFKA_TOPICS.NOTIFICATION_FAILED, failed);
    }
  }

  private async emitKafka(topic: string, notification: any): Promise<void> {
    const payload: NotificationEventPayload = {
      notificationId: notification.id,
      userId: notification.userId,
      channel: notification.channel,
      category: notification.category,
      title: notification.title,
      status: notification.status,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducer.emit(topic, payload);
  }
}
