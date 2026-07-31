import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { TemplateService } from './template.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions } from '@app/auth';
import {
  CreateNotificationDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  NotificationQueryDto,
  UuidParamDto,
} from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Notifications & Template Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly templateService: TemplateService,
  ) {}

  @Post()
  @Permissions(PermissionEnum.NOTIFICATION_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create and dispatch a multi-channel notification (Email, SMS, Push, In-App, Webhook)',
  })
  @ApiResponse({ status: 201, description: 'Notification created and dispatched' })
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.createNotification(dto);
  }

  @Get()
  @Permissions(PermissionEnum.NOTIFICATION_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get paginated list of notifications with channel/category/status filters',
  })
  @ApiResponse({ status: 200, description: 'Notifications list returned' })
  async findAll(@Query() query: NotificationQueryDto) {
    return this.notificationService.findAllNotifications(query);
  }

  @Get('user/:userId')
  @Permissions(PermissionEnum.NOTIFICATION_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List notifications for a specific user' })
  @ApiResponse({ status: 200, description: 'User notifications returned' })
  async findUserNotifications(@Param('userId') userId: string) {
    return this.notificationService.findUserNotifications(userId);
  }

  @Patch(':id/read')
  @Permissions(PermissionEnum.NOTIFICATION_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification status as READ' })
  @ApiResponse({ status: 200, description: 'Notification marked as READ' })
  async markAsRead(@Param() param: UuidParamDto) {
    return this.notificationService.markAsRead(param.id);
  }

  @Delete(':id')
  @Permissions(PermissionEnum.NOTIFICATION_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification record' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async delete(@Param() param: UuidParamDto) {
    return this.notificationService.deleteNotification(param.id);
  }

  @Get(':id')
  @Permissions(PermissionEnum.NOTIFICATION_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get notification details by ID' })
  @ApiResponse({ status: 200, description: 'Notification details returned' })
  async findOne(@Param() param: UuidParamDto) {
    return this.notificationService.findNotificationById(param.id);
  }

  // Template Endpoints
  @Post('templates')
  @Permissions(PermissionEnum.NOTIFICATION_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create reusable notification template with variable placeholders' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.templateService.createTemplate(dto);
  }

  @Get('templates')
  @Permissions(PermissionEnum.NOTIFICATION_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List reusable notification templates' })
  @ApiResponse({ status: 200, description: 'Templates list returned' })
  async findAllTemplates() {
    return this.templateService.findAllTemplates();
  }

  @Patch('templates/:id')
  @Permissions(PermissionEnum.NOTIFICATION_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update template subject/body and increment version' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  async updateTemplate(@Param() param: UuidParamDto, @Body() dto: UpdateTemplateDto) {
    return this.templateService.updateTemplate(param.id, dto);
  }
}
