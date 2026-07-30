import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '@app/database';
import { KafkaProducerService } from '@app/kafka';
import { CreateWebhookDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper } from '@app/common';
import { KAFKA_TOPICS } from '@app/events';

@Injectable()
export class WebhookEngine {
  private readonly logger = new Logger(WebhookEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createWebhook(dto: CreateWebhookDto): Promise<ApiResponseInterface> {
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const webhook = await this.prisma.webhook.create({
      data: {
        name: dto.name,
        url: dto.url,
        secret,
        events: dto.events,
        active: true,
      },
    });

    this.logger.log(`Registered Webhook [${webhook.name}] targeting URL [${webhook.url}]`);
    return ResponseHelper.success(webhook, 'Webhook registered successfully', 201);
  }

  async findAllWebhooks(): Promise<ApiResponseInterface> {
    const webhooks = await this.prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return ResponseHelper.success(webhooks);
  }

  async updateWebhook(
    id: string,
    updates: Partial<CreateWebhookDto>,
  ): Promise<ApiResponseInterface> {
    const existing = await this.prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    const updated = await this.prisma.webhook.update({
      where: { id },
      data: updates,
    });

    return ResponseHelper.success(updated, 'Webhook updated successfully');
  }

  async deleteWebhook(id: string): Promise<ApiResponseInterface> {
    const existing = await this.prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    await this.prisma.webhook.delete({ where: { id } });
    return ResponseHelper.success(null, 'Webhook deleted');
  }

  async dispatchWebhookEvent(eventName: string, payload: any): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { active: true },
    });

    const matchingWebhooks = webhooks.filter(
      (wh) => wh.events.includes('*') || wh.events.includes(eventName),
    );

    for (const webhook of matchingWebhooks) {
      try {
        const body = JSON.stringify({
          event: eventName,
          payload,
          timestamp: new Date().toISOString(),
        });
        const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');

        this.logger.log(
          `Dispatching Webhook [${webhook.name}] signature [t=${signature.substring(0, 8)}...] to [${webhook.url}]`,
        );

        await this.kafkaProducer.emit(KAFKA_TOPICS.WEBHOOK_EXECUTED, {
          webhookId: webhook.id,
          url: webhook.url,
          event: eventName,
          status: 'DELIVERED',
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        this.logger.error(`Failed to dispatch webhook [${webhook.id}] to [${webhook.url}]`, err);
      }
    }
  }
}
