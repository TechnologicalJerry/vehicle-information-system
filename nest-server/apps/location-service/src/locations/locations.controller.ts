import { Controller, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions } from '@app/auth';
import { LocationQueryDto } from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Location & Tracking')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('latest/:vehicleId')
  @Permissions(PermissionEnum.LOCATION_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get latest vehicle location snapshot from Redis cache' })
  @ApiResponse({ status: 200, description: 'Latest location snapshot returned' })
  @ApiResponse({ status: 404, description: 'Vehicle location not found' })
  async getLatest(@Param('vehicleId') vehicleId: string) {
    return this.locationsService.getLatest(vehicleId);
  }

  @Get('history/:vehicleId')
  @Permissions(PermissionEnum.LOCATION_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vehicle location route trajectory history' })
  @ApiResponse({ status: 200, description: 'Location route history returned' })
  async getHistory(
    @Param('vehicleId') vehicleId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.locationsService.getHistory(vehicleId, startDate, endDate, Number(limit) || 100);
  }

  @Get('search')
  @Permissions(PermissionEnum.LOCATION_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search location history with bounding box spatial coordinates' })
  @ApiResponse({ status: 200, description: 'Location search results returned' })
  async search(@Query() query: LocationQueryDto) {
    return this.locationsService.search(query);
  }

  @Get('fleet/:fleetId')
  @Permissions(PermissionEnum.LOCATION_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get location snapshots for all active vehicles in a fleet' })
  @ApiResponse({ status: 200, description: 'Fleet location snapshots returned' })
  async getFleetLocations(@Param('fleetId') fleetId: string, @Query() query: LocationQueryDto) {
    return this.locationsService.search({ ...query, fleetId });
  }
}
