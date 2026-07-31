import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { KafkaProducerService } from '@app/kafka';
import { PreferencesService } from './preferences.service';
import { DeliveryDispatcherEngine } from './delivery-dispatcher.engine';
import { CreateNotificationDto, NotificationQueryDto } from '@app/dto';
import {
  ApiResponseInterface,
  ResponseHelper,
  NotificationStatus,
  NotificationPriority,
} from '@app/common';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly preferencesService: PreferencesService,
    private readonly deliveryDispatcher: DeliveryDispatcherEngine,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<ApiResponseInterface> {
    // 1. Evaluate User Preferences if userId provided
    if (dto.userId) {
      const allowed = await this.preferencesService.isNotificationAllowed(
        dto.userId,
        dto.channel,
        dto.category,
      );
      if (!allowed) {
        this.logger.log(`Notification for user [${dto.userId}] blocked by user preferences`);
        return ResponseHelper.success(null, 'Notification blocked by user preferences');
      }
    }

    // 2. Persist Notification Record
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        vehicleId: dto.vehicleId,
        fleetId: dto.fleetId,
        channel: dto.channel,
        category: dto.category,
        title: dto.title,
        message: dto.message,
        payload: dto.payload || {},
        priority: dto.priority || NotificationPriority.MEDIUM,
        status: NotificationStatus.PENDING,
      },
    });

    // 3. Dispatch Delivery
    await this.deliveryDispatcher.dispatchNotification(notification.id);

    // 4. Emit Kafka Event
    await this.kafkaProducer.emit(KAFKA_TOPICS.NOTIFICATION_CREATED, {
      notificationId: notification.id,
      userId: dto.userId,
      channel: dto.channel,
      category: dto.category,
      title: dto.title,
      timestamp: new Date().toISOString(),
    });

    return ResponseHelper.success(notification, 'Notification created and dispatched', 201);
  }

  async findAllNotifications(query: NotificationQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.channel) where.channel = query.channel;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;

    const [notifications, totalItems] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return ResponseHelper.success(notifications, 'Notifications fetched successfully', 200, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }

  async findNotificationById(id: string): Promise<ApiResponseInterface> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return ResponseHelper.success(notification);
  }

  async findUserNotifications(userId: string): Promise<ApiResponseInterface> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ResponseHelper.success(notifications);
  }

  async markAsRead(id: string): Promise<ApiResponseInterface> {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return ResponseHelper.success(updated, 'Notification marked as read');
  }

  async deleteNotification(id: string): Promise<ApiResponseInterface> {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    await this.prisma.notification.delete({ where: { id } });
    return ResponseHelper.success(null, 'Notification deleted successfully');
  }
}
