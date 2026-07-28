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
import { OtaService } from './ota.service';
import { FirmwareService } from './firmware.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions, CurrentUser } from '@app/auth';
import {
  CreateFirmwareDto,
  CreateCampaignDto,
  OtaDeployDto,
  OtaRollbackDto,
  OtaQueryDto,
  UuidParamDto,
} from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('OTA Updates & Firmware Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller()
export class OtaController {
  constructor(
    private readonly otaService: OtaService,
    private readonly firmwareService: FirmwareService,
  ) {}

  // Firmware Endpoints
  @Post('firmware')
  @Permissions(PermissionEnum.FIRMWARE_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new Firmware release version with SHA-256 checksum validation',
  })
  @ApiResponse({ status: 201, description: 'Firmware created successfully' })
  async createFirmware(@Body() dto: CreateFirmwareDto) {
    return this.firmwareService.createFirmware(dto);
  }

  @Get('firmware')
  @Permissions(PermissionEnum.OTA_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List registered Firmware release versions' })
  @ApiResponse({ status: 200, description: 'Firmwares list returned' })
  async findAllFirmware() {
    return this.firmwareService.findAllFirmware();
  }

  @Get('firmware/:id')
  @Permissions(PermissionEnum.OTA_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Firmware details by ID' })
  @ApiResponse({ status: 200, description: 'Firmware details returned' })
  async findFirmwareById(@Param() param: UuidParamDto) {
    return this.firmwareService.findFirmwareById(param.id);
  }

  @Patch('firmware/:id')
  @Permissions(PermissionEnum.FIRMWARE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Firmware release metadata' })
  @ApiResponse({ status: 200, description: 'Firmware updated' })
  async updateFirmware(@Param() param: UuidParamDto, @Body() body: any) {
    return this.firmwareService.updateFirmware(param.id, body);
  }

  @Delete('firmware/:id')
  @Permissions(PermissionEnum.FIRMWARE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete Firmware release' })
  @ApiResponse({ status: 200, description: 'Firmware deleted' })
  async deleteFirmware(@Param() param: UuidParamDto) {
    return this.firmwareService.deleteFirmware(param.id);
  }

  // OTA Campaign Endpoints
  @Post('ota/campaigns')
  @Permissions(PermissionEnum.OTA_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an OTA update campaign for fleet rollout' })
  @ApiResponse({ status: 201, description: 'OTA Campaign created' })
  async createCampaign(@Body() dto: CreateCampaignDto, @CurrentUser('id') userId: string) {
    return this.otaService.createCampaign(dto, userId);
  }

  @Get('ota/campaigns')
  @Permissions(PermissionEnum.OTA_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List OTA update campaigns' })
  @ApiResponse({ status: 200, description: 'Campaigns list returned' })
  async findAllCampaigns(@Query() query: OtaQueryDto) {
    return this.otaService.findAllCampaigns(query);
  }

  @Get('ota/campaigns/:id')
  @Permissions(PermissionEnum.OTA_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get OTA campaign details and progress' })
  @ApiResponse({ status: 200, description: 'Campaign details returned' })
  async findCampaignById(@Param() param: UuidParamDto) {
    return this.otaService.findCampaignById(param.id);
  }

  @Post('ota/deploy')
  @Permissions(PermissionEnum.OTA_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger OTA campaign rollout to target fleet vehicles' })
  @ApiResponse({ status: 200, description: 'OTA deployment initiated' })
  async deployCampaign(@Body() dto: OtaDeployDto) {
    return this.otaService.deployCampaign(dto);
  }

  @Post('ota/rollback')
  @Permissions(PermissionEnum.OTA_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate automatic firmware rollback for a vehicle' })
  @ApiResponse({ status: 200, description: 'Firmware rollback initiated' })
  async rollback(@Body() dto: OtaRollbackDto) {
    return this.otaService.rollbackVehicle(dto);
  }

  @Get('ota/history')
  @Permissions(PermissionEnum.OTA_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get OTA deployment execution history logs' })
  @ApiResponse({ status: 200, description: 'OTA deployment history returned' })
  async getHistory() {
    return this.otaService.getOtaHistory();
  }

  @Get('ota/statistics')
  @Permissions(PermissionEnum.OTA_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get OTA deployment success rate statistics' })
  @ApiResponse({ status: 200, description: 'OTA statistics returned' })
  async getStatistics() {
    return this.otaService.getOtaStatistics();
  }
}
