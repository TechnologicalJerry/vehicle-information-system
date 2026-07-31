import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { TelemetryAggregationService } from './telemetry-aggregation.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions } from '@app/auth';
import {
  CreateTelemetryDto,
  BulkTelemetryDto,
  TelemetryQueryDto,
  TelemetryStatsQueryDto,
} from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Telemetry Platform')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('telemetry')
export class TelemetryController {
  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly telemetryAggregationService: TelemetryAggregationService,
  ) {}

  @Post()
  @Permissions(PermissionEnum.TELEMETRY)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ingest single real-time vehicle telemetry packet (Requires TELEMETRY permission)',
  })
  @ApiResponse({ status: 201, description: 'Telemetry ingested successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async ingest(@Body() dto: CreateTelemetryDto) {
    return this.telemetryService.ingest(dto);
  }

  @Post('bulk')
  @Permissions(PermissionEnum.TELEMETRY)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk ingest array of vehicle telemetry packets (Requires TELEMETRY permission)',
  })
  @ApiResponse({ status: 201, description: 'Bulk telemetry ingested' })
  async ingestBulk(@Body() dto: BulkTelemetryDto) {
    return this.telemetryService.ingestBulk(dto);
  }

  @Get()
  @Permissions(PermissionEnum.TELEMETRY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search telemetry events with filtering, date range, and pagination' })
  @ApiResponse({ status: 200, description: 'Telemetry search results' })
  async search(@Query() query: TelemetryQueryDto) {
    return this.telemetryService.search(query);
  }

  @Get('latest/:vehicleId')
  @Permissions(PermissionEnum.TELEMETRY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fast sub-millisecond lookup of latest vehicle telemetry state from Redis',
  })
  @ApiResponse({ status: 200, description: 'Latest vehicle state returned' })
  @ApiResponse({ status: 404, description: 'No telemetry state found' })
  async getLatest(@Param('vehicleId') vehicleId: string) {
    return this.telemetryService.getLatest(vehicleId);
  }

  @Get('vehicle/:vehicleId')
  @Permissions(PermissionEnum.TELEMETRY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vehicle telemetry history from MongoDB' })
  @ApiResponse({ status: 200, description: 'Vehicle telemetry history returned' })
  async getVehicleTelemetry(
    @Param('vehicleId') vehicleId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.telemetryService.getHistory(vehicleId, startDate, endDate, Number(limit) || 100);
  }

  @Get('history/:vehicleId')
  @Permissions(PermissionEnum.TELEMETRY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get time-series trajectory points for map rendering' })
  @ApiResponse({ status: 200, description: 'Time-series trajectory returned' })
  async getHistory(
    @Param('vehicleId') vehicleId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.telemetryService.getHistory(vehicleId, startDate, endDate, Number(limit) || 100);
  }

  @Get('statistics/:vehicleId')
  @Permissions(PermissionEnum.TELEMETRY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get aggregate metrics (average/max speed, distance, battery usage, idle time)',
  })
  @ApiResponse({ status: 200, description: 'Vehicle telemetry statistics returned' })
  async getStatistics(
    @Param('vehicleId') vehicleId: string,
    @Query() query: TelemetryStatsQueryDto,
  ) {
    const start = query.startDate ? new Date(query.startDate) : undefined;
    const end = query.endDate ? new Date(query.endDate) : undefined;
    return this.telemetryAggregationService.calculateVehicleStatistics(vehicleId, start, end);
  }

  @Get(':id')
  @Permissions(PermissionEnum.TELEMETRY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get specific telemetry record by Mongo ID' })
  @ApiResponse({ status: 200, description: 'Telemetry record returned' })
  @ApiResponse({ status: 404, description: 'Telemetry record not found' })
  async findOne(@Param('id') id: string) {
    return this.telemetryService.findById(id);
  }

  @Delete(':id')
  @Permissions(PermissionEnum.TELEMETRY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete specific telemetry record' })
  @ApiResponse({ status: 200, description: 'Telemetry record deleted' })
  async remove(@Param('id') id: string) {
    return this.telemetryService.deleteTelemetry(id);
  }
}
