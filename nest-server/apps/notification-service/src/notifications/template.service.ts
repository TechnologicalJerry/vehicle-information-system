import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { CreateTemplateDto, UpdateTemplateDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper } from '@app/common';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTemplate(dto: CreateTemplateDto): Promise<ApiResponseInterface> {
    const existing = await this.prisma.notificationTemplate.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`Template with name ${dto.name} already exists`);
    }

    const template = await this.prisma.notificationTemplate.create({
      data: {
        name: dto.name,
        channel: dto.channel,
        subject: dto.subject,
        body: dto.body,
        variables: dto.variables,
        version: 1,
        active: true,
      },
    });

    this.logger.log(`Created Notification Template [${dto.name}] (v1)`);
    return ResponseHelper.success(template, 'Notification template created successfully', 201);
  }

  async renderTemplate(
    templateName: string,
    params: Record<string, any>,
  ): Promise<{ subject: string; body: string }> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { name: templateName },
    });

    if (!template || !template.active) {
      return {
        subject: params.title || 'Notification Alert',
        body: params.message || 'Notification message',
      };
    }

    let renderedSubject = template.subject;
    let renderedBody = template.body;

    for (const key of Object.keys(params)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      renderedSubject = renderedSubject.replace(regex, String(params[key]));
      renderedBody = renderedBody.replace(regex, String(params[key]));
    }

    return {
      subject: renderedSubject,
      body: renderedBody,
    };
  }

  async findAllTemplates(): Promise<ApiResponseInterface> {
    const templates = await this.prisma.notificationTemplate.findMany({
      orderBy: { name: 'asc' },
    });
    return ResponseHelper.success(templates);
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<ApiResponseInterface> {
    const existing = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    const updated = await this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...dto,
        version: { increment: 1 },
      },
    });

    return ResponseHelper.success(updated, 'Notification template updated and version incremented');
  }
}
