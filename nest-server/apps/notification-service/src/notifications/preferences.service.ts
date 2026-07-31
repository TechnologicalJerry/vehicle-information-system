import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { NotificationChannel, NotificationCategory } from '@app/common';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async isNotificationAllowed(
    userId: string,
    channel: NotificationChannel,
    category: NotificationCategory,
  ): Promise<boolean> {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!pref) return true; // Default allow if preferences not set

    const allowedChannels = (pref.channels as string[]) || [];
    const allowedCategories = (pref.categories as string[]) || [];

    if (!allowedChannels.includes(channel) || !allowedCategories.includes(category)) {
      return false;
    }

    // Quiet hours check
    if (pref.quietHoursStart && pref.quietHoursEnd) {
      const now = new Date();
      const currentHour = now.getUTCHours();
      const startHour = parseInt(pref.quietHoursStart.split(':')[0], 10);
      const endHour = parseInt(pref.quietHoursEnd.split(':')[0], 10);

      if (startHour <= endHour) {
        if (currentHour >= startHour && currentHour < endHour) return false;
      } else {
        if (currentHour >= startHour || currentHour < endHour) return false;
      }
    }

    return true;
  }
}
