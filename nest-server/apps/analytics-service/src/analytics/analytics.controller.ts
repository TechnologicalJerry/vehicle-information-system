import { Controller, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions } from '@app/auth';
import { AnalyticsQueryDto } from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Business Intelligence & Analytics Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Permissions(PermissionEnum.DASHBOARD_VIEW)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get high-level executive dashboard metrics (Fleet utilization, active DTCs, commands, OTA)',
  })
  @ApiResponse({ status: 200, description: 'Executive dashboard metrics returned' })
  async getDashboard() {
    return this.analyticsService.getDashboardOverview();
  }

  @Get('fleet/:fleetId')
  @Permissions(PermissionEnum.FLEET_ANALYTICS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get comprehensive fleet performance analytics and time-series rollup stats',
  })
  @ApiResponse({ status: 200, description: 'Fleet analytics returned' })
  async getFleetAnalytics(@Param('fleetId') fleetId: string, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getFleetAnalytics(fleetId, query);
  }

  @Get('vehicle/:vehicleId')
  @Permissions(PermissionEnum.ANALYTICS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vehicle usage trends, health history, and lifetime statistics' })
  @ApiResponse({ status: 200, description: 'Vehicle analytics returned' })
  async getVehicleAnalytics(@Param('vehicleId') vehicleId: string) {
    return this.analyticsService.getVehicleAnalytics(vehicleId);
  }

  @Get('driver/:driverId')
  @Permissions(PermissionEnum.ANALYTICS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get driver safety trends, rank history, and safety scores' })
  @ApiResponse({ status: 200, description: 'Driver analytics returned' })
  async getDriverAnalytics(@Param('driverId') driverId: string) {
    return this.analyticsService.getDriverAnalytics(driverId);
  }

  @Get('trips')
  @Permissions(PermissionEnum.ANALYTICS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get aggregated trip analytics (distance, duration, fuel, speed)' })
  @ApiResponse({ status: 200, description: 'Trip analytics returned' })
  async getTripAnalytics() {
    return this.analyticsService.getTripAnalytics();
  }

  @Get('ota')
  @Permissions(PermissionEnum.ANALYTICS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get OTA deployment success rate and firmware adoption analytics' })
  @ApiResponse({ status: 200, description: 'OTA analytics returned' })
  async getOtaAnalytics() {
    return this.analyticsService.getOtaAnalytics();
  }

  @Get('commands')
  @Permissions(PermissionEnum.ANALYTICS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get remote command latency and execution success analytics' })
  @ApiResponse({ status: 200, description: 'Command analytics returned' })
  async getCommandAnalytics() {
    return this.analyticsService.getCommandAnalytics();
  }
}
