import { Controller, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DiagnosticsService } from './diagnostics.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions } from '@app/auth';
import { DiagnosticQueryDto, UuidParamDto } from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Vehicle Diagnostics & Maintenance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Get()
  @Permissions(PermissionEnum.DIAGNOSTICS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of Diagnostic Trouble Codes (DTCs) with filters' })
  @ApiResponse({ status: 200, description: 'DTCs list returned' })
  async findAll(@Query() query: DiagnosticQueryDto) {
    return this.diagnosticsService.findAllDtcs(query);
  }

  @Get('health/:vehicleId')
  @Permissions(PermissionEnum.DIAGNOSTICS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get overall Vehicle Health Score (0-100), component scores, and health trend',
  })
  @ApiResponse({ status: 200, description: 'Vehicle health score breakdown returned' })
  async getHealthScore(@Param('vehicleId') vehicleId: string) {
    return this.diagnosticsService.getHealthScore(vehicleId);
  }

  @Get('recommendations/:vehicleId')
  @Permissions(PermissionEnum.MAINTENANCE_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get maintenance recommendations for a vehicle' })
  @ApiResponse({ status: 200, description: 'Maintenance recommendations returned' })
  async getRecommendations(@Param('vehicleId') vehicleId: string) {
    return this.diagnosticsService.getRecommendations(vehicleId);
  }

  @Get('history/:vehicleId')
  @Permissions(PermissionEnum.DIAGNOSTICS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get historical diagnostic events from MongoDB' })
  @ApiResponse({ status: 200, description: 'Diagnostic event history returned' })
  async getHistory(@Param('vehicleId') vehicleId: string) {
    return this.diagnosticsService.getDiagnosticHistory(vehicleId);
  }

  @Get('vehicle/:vehicleId')
  @Permissions(PermissionEnum.DIAGNOSTICS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active DTCs for a vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle active DTCs returned' })
  async getVehicleDtcs(@Param('vehicleId') vehicleId: string) {
    return this.diagnosticsService.findVehicleDtcs(vehicleId);
  }

  @Get(':id')
  @Permissions(PermissionEnum.DIAGNOSTICS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get specific DTC details by ID' })
  @ApiResponse({ status: 200, description: 'DTC details returned' })
  @ApiResponse({ status: 404, description: 'DTC not found' })
  async findOne(@Param() param: UuidParamDto) {
    return this.diagnosticsService.findDtcById(param.id);
  }
}
