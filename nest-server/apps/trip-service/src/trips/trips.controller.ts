import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions } from '@app/auth';
import { StartTripDto, EndTripDto, TripQueryDto, TripStatsQueryDto, UuidParamDto } from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Trip Management & Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post('start')
  @Permissions(PermissionEnum.TRIP_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Manually start a new vehicle trip (Requires TRIP_MANAGE permission)' })
  @ApiResponse({ status: 201, description: 'Trip started successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async startTrip(@Body() dto: StartTripDto) {
    return this.tripsService.startTrip(dto);
  }

  @Post(':id/end')
  @Permissions(PermissionEnum.TRIP_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually end an active in-progress trip' })
  @ApiResponse({ status: 200, description: 'Trip completed successfully' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async endTrip(@Param('id') id: string, @Body() dto: EndTripDto) {
    return this.tripsService.endTrip(id, dto);
  }

  @Get()
  @Permissions(PermissionEnum.TRIP_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get paginated list of trips with vehicle, fleet, driver & status filters',
  })
  @ApiResponse({ status: 200, description: 'Trips list returned' })
  async findAll(@Query() query: TripQueryDto) {
    return this.tripsService.findAll(query);
  }

  @Get('statistics')
  @Permissions(PermissionEnum.TRIP_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get aggregate trip analytics (total distance, duration, idle time, avg speed, fuel/battery consumed)',
  })
  @ApiResponse({ status: 200, description: 'Trip analytics statistics returned' })
  async getStatistics(@Query() query: TripStatsQueryDto) {
    return this.tripsService.getStatistics(query);
  }

  @Get('history')
  @Permissions(PermissionEnum.TRIP_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get historical trip records' })
  @ApiResponse({ status: 200, description: 'Trip history returned' })
  async getHistory(@Query() query: TripQueryDto) {
    return this.tripsService.findAll(query);
  }

  @Get(':id')
  @Permissions(PermissionEnum.TRIP_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trip details with recorded route points trajectory from MongoDB' })
  @ApiResponse({ status: 200, description: 'Trip details with route points returned' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async findOne(@Param() param: UuidParamDto) {
    return this.tripsService.findById(param.id);
  }

  @Get('vehicle/:vehicleId')
  @Permissions(PermissionEnum.TRIP_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trips recorded for a specific vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle trips returned' })
  async getVehicleTrips(@Param('vehicleId') vehicleId: string, @Query() query: TripQueryDto) {
    return this.tripsService.findAll({ ...query, vehicleId });
  }

  @Get('fleet/:fleetId')
  @Permissions(PermissionEnum.TRIP_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trips recorded for a fleet' })
  @ApiResponse({ status: 200, description: 'Fleet trips returned' })
  async getFleetTrips(@Param('fleetId') fleetId: string, @Query() query: TripQueryDto) {
    return this.tripsService.findAll({ ...query, fleetId });
  }
}
