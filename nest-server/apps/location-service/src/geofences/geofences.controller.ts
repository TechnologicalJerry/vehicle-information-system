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
import { GeofencesService } from './geofences.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions } from '@app/auth';
import { CreateGeofenceDto, UpdateGeofenceDto } from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Geofencing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('geofences')
export class GeofencesController {
  constructor(private readonly geofencesService: GeofencesService) {}

  @Post()
  @Permissions(PermissionEnum.GEOFENCE_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new Geofence boundary (Circle or Polygon)' })
  @ApiResponse({ status: 201, description: 'Geofence created successfully' })
  async create(@Body() dto: CreateGeofenceDto) {
    return this.geofencesService.createGeofence(dto);
  }

  @Get()
  @Permissions(PermissionEnum.LOCATION_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active Geofences for a fleet' })
  @ApiResponse({ status: 200, description: 'Geofences list returned' })
  async findAll(@Query('fleetId') fleetId?: string) {
    return this.geofencesService.findAll(fleetId);
  }

  @Get(':id')
  @Permissions(PermissionEnum.LOCATION_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Geofence by ID' })
  @ApiResponse({ status: 200, description: 'Geofence details returned' })
  @ApiResponse({ status: 404, description: 'Geofence not found' })
  async findOne(@Param('id') id: string) {
    return this.geofencesService.findById(id);
  }

  @Patch(':id')
  @Permissions(PermissionEnum.GEOFENCE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Geofence parameters or activate/deactivate status' })
  @ApiResponse({ status: 200, description: 'Geofence updated successfully' })
  @ApiResponse({ status: 404, description: 'Geofence not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateGeofenceDto) {
    return this.geofencesService.updateGeofence(id, dto);
  }

  @Delete(':id')
  @Permissions(PermissionEnum.GEOFENCE_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete Geofence' })
  @ApiResponse({ status: 200, description: 'Geofence deleted successfully' })
  @ApiResponse({ status: 404, description: 'Geofence not found' })
  async remove(@Param('id') id: string) {
    return this.geofencesService.deleteGeofence(id);
  }
}
