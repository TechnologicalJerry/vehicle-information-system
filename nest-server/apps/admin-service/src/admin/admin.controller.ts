import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { FeatureFlagService } from './feature-flag.service';
import { ApiKeyService } from './api-key.service';
import { WebhookEngine } from './webhook.engine';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions, CurrentUser } from '@app/auth';
import {
  UpdateSettingDto,
  CreateFeatureFlagDto,
  CreateApiKeyDto,
  CreateWebhookDto,
  UuidParamDto,
} from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Platform Governance & Administration')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly apiKeyService: ApiKeyService,
    private readonly webhookEngine: WebhookEngine,
  ) {}

  @Get('dashboard')
  @Permissions(PermissionEnum.ADMIN_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get global admin platform dashboard overview metrics' })
  @ApiResponse({ status: 200, description: 'Platform overview metrics returned' })
  async getDashboard() {
    return this.adminService.getAdminDashboard();
  }

  @Get('settings')
  @Permissions(PermissionEnum.ADMIN_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all system settings and configuration parameters' })
  @ApiResponse({ status: 200, description: 'System settings returned' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @Permissions(PermissionEnum.SETTINGS_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update or create a system setting' })
  @ApiResponse({ status: 200, description: 'System setting updated' })
  async updateSetting(@Body() dto: UpdateSettingDto) {
    return this.adminService.updateSetting(dto);
  }

  // Feature Flag APIs
  @Post('feature-flags')
  @Permissions(PermissionEnum.FEATURE_FLAGS_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a feature flag with optional percentage rollout' })
  @ApiResponse({ status: 201, description: 'Feature flag created' })
  async createFeatureFlag(@Body() dto: CreateFeatureFlagDto) {
    return this.featureFlagService.createFeatureFlag(dto);
  }

  @Get('feature-flags')
  @Permissions(PermissionEnum.ADMIN_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all feature flags' })
  @ApiResponse({ status: 200, description: 'Feature flags returned' })
  async findAllFeatureFlags() {
    return this.featureFlagService.findAllFlags();
  }

  @Patch('feature-flags/:id')
  @Permissions(PermissionEnum.FEATURE_FLAGS_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update feature flag parameters (enabled state, rollout percentage)' })
  @ApiResponse({ status: 200, description: 'Feature flag updated' })
  async updateFeatureFlag(
    @Param() param: UuidParamDto,
    @Body() dto: Partial<CreateFeatureFlagDto>,
  ) {
    return this.featureFlagService.updateFeatureFlag(param.id, dto);
  }

  @Delete('feature-flags/:id')
  @Permissions(PermissionEnum.FEATURE_FLAGS_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag deleted' })
  async deleteFeatureFlag(@Param() param: UuidParamDto) {
    return this.featureFlagService.deleteFeatureFlag(param.id);
  }

  // API Key APIs
  @Post('api-keys')
  @Permissions(PermissionEnum.API_KEYS_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new HMAC API key for integrations' })
  @ApiResponse({ status: 201, description: 'API Key generated' })
  async createApiKey(@Body() dto: CreateApiKeyDto, @CurrentUser('id') ownerId: string) {
    return this.apiKeyService.createApiKey(dto, ownerId);
  }

  @Get('api-keys')
  @Permissions(PermissionEnum.ADMIN_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List generated API keys' })
  @ApiResponse({ status: 200, description: 'API keys returned' })
  async findAllApiKeys() {
    return this.apiKeyService.findAllApiKeys();
  }

  @Delete('api-keys/:id')
  @Permissions(PermissionEnum.API_KEYS_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked' })
  async revokeApiKey(@Param() param: UuidParamDto) {
    return this.apiKeyService.revokeApiKey(param.id);
  }

  // Webhook APIs
  @Post('webhooks')
  @Permissions(PermissionEnum.WEBHOOKS_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new outbound webhook with HMAC SHA-256 signatures' })
  @ApiResponse({ status: 201, description: 'Webhook registered' })
  async createWebhook(@Body() dto: CreateWebhookDto) {
    return this.webhookEngine.createWebhook(dto);
  }

  @Get('webhooks')
  @Permissions(PermissionEnum.ADMIN_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List registered outbound webhooks' })
  @ApiResponse({ status: 200, description: 'Webhooks returned' })
  async findAllWebhooks() {
    return this.webhookEngine.findAllWebhooks();
  }

  @Patch('webhooks/:id')
  @Permissions(PermissionEnum.WEBHOOKS_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update webhook parameters (URL, events)' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  async updateWebhook(@Param() param: UuidParamDto, @Body() dto: Partial<CreateWebhookDto>) {
    return this.webhookEngine.updateWebhook(param.id, dto);
  }

  @Delete('webhooks/:id')
  @Permissions(PermissionEnum.WEBHOOKS_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a registered webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  async deleteWebhook(@Param() param: UuidParamDto) {
    return this.webhookEngine.deleteWebhook(param.id);
  }
}
