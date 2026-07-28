import { Controller, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DriverBehaviourService } from './driver-behaviour.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions } from '@app/auth';
import { DriverBehaviourQueryDto, DriverRankingQueryDto } from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Driver Behaviour Analytics & Safety Scoring')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('driver-behaviour')
export class DriverBehaviourController {
  constructor(private readonly driverBehaviourService: DriverBehaviourService) {}

  @Get()
  @Permissions(PermissionEnum.DRIVER_BEHAVIOUR_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of driver behaviour safety events' })
  @ApiResponse({ status: 200, description: 'Driver behaviour events list returned' })
  async findAll(@Query() query: DriverBehaviourQueryDto) {
    return this.driverBehaviourService.findAllEvents(query);
  }

  @Get('events')
  @Permissions(PermissionEnum.DRIVER_BEHAVIOUR_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query specific safety events (harsh braking, overspeed, seatbelt violations)',
  })
  @ApiResponse({ status: 200, description: 'Safety events returned' })
  async getEvents(@Query() query: DriverBehaviourQueryDto) {
    return this.driverBehaviourService.findAllEvents(query);
  }

  @Get('ranking')
  @Permissions(PermissionEnum.FLEET_ANALYTICS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get fleet driver safety rankings (Daily, Weekly, Monthly)' })
  @ApiResponse({ status: 200, description: 'Fleet driver rankings returned' })
  async getRankings(@Query() query: DriverRankingQueryDto) {
    return this.driverBehaviourService.getFleetRankings(query);
  }

  @Get('score/:driverId')
  @Permissions(PermissionEnum.DRIVER_BEHAVIOUR_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Driver Safety Score (0-100) and sub-scores breakdown' })
  @ApiResponse({ status: 200, description: 'Driver score breakdown returned' })
  async getDriverScore(@Param('driverId') driverId: string) {
    return this.driverBehaviourService.getDriverScore(driverId);
  }

  @Get('driver/:driverId')
  @Permissions(PermissionEnum.DRIVER_BEHAVIOUR_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get safety events recorded for a specific driver' })
  @ApiResponse({ status: 200, description: 'Driver safety events returned' })
  async getDriverEvents(@Param('driverId') driverId: string) {
    return this.driverBehaviourService.findDriverEvents(driverId);
  }

  @Get(':vehicleId')
  @Permissions(PermissionEnum.DRIVER_BEHAVIOUR_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get safety events recorded for a vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle safety events returned' })
  async getVehicleEvents(@Param('vehicleId') vehicleId: string) {
    return this.driverBehaviourService.findVehicleEvents(vehicleId);
  }
}
