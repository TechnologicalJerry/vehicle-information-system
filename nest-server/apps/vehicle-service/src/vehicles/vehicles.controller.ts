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
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions } from '@app/auth';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  AssignDriverDto,
  TransferVehicleDto,
  PairVehicleDto,
  ChangeVehicleStatusDto,
  VehicleQueryDto,
  UuidParamDto,
} from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Vehicle Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Register a new Vehicle with VIN validation & ISO 3779 checksum (Requires VEHICLE_MANAGEMENT permission)',
  })
  @ApiResponse({ status: 201, description: 'Vehicle registered successfully' })
  @ApiResponse({ status: 400, description: 'VIN validation checksum or format error' })
  @ApiResponse({ status: 409, description: 'Duplicate VIN or registration number' })
  async create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.createVehicle(dto);
  }

  @Get()
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get paginated list of Vehicles (Requires VEHICLE_MANAGEMENT permission)',
  })
  @ApiResponse({ status: 200, description: 'Vehicle list returned' })
  async findAll(@Query() query: VehicleQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get('search')
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Global Vehicle search by VIN, registration number, make, or model (Requires VEHICLE_MANAGEMENT permission)',
  })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async search(@Query() query: VehicleQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get(':id')
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get Vehicle details with driver assignment & telemetry pairing history (Requires VEHICLE_MANAGEMENT permission)',
  })
  @ApiResponse({ status: 200, description: 'Vehicle details returned' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async findOne(@Param() param: UuidParamDto) {
    return this.vehiclesService.findById(param.id);
  }

  @Patch(':id')
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Vehicle specifications or odometer (Requires VEHICLE_MANAGEMENT permission)',
  })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async update(@Param() param: UuidParamDto, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.updateVehicle(param.id, dto);
  }

  @Delete(':id')
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Soft delete Vehicle account & release active drivers (Requires VEHICLE_MANAGEMENT permission)',
  })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async remove(@Param() param: UuidParamDto) {
    return this.vehiclesService.deleteVehicle(param.id);
  }

  @Post(':id/assign-driver')
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Assign a Driver to a Vehicle (Releases existing driver to enforce single active driver constraint)',
  })
  @ApiResponse({ status: 200, description: 'Driver assigned successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle or Driver not found' })
  async assignDriver(@Param() param: UuidParamDto, @Body() dto: AssignDriverDto) {
    return this.vehiclesService.assignDriver(param.id, dto);
  }

  @Post(':id/remove-driver')
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release active Driver assignment for a Vehicle' })
  @ApiResponse({ status: 200, description: 'Driver removed successfully' })
  async removeDriver(@Param() param: UuidParamDto) {
    return this.vehiclesService.removeDriver(param.id);
  }

  @Post(':id/transfer')
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer Vehicle ownership to another Fleet' })
  @ApiResponse({ status: 200, description: 'Vehicle transferred successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle or destination Fleet not found' })
  async transferVehicle(@Param() param: UuidParamDto, @Body() dto: TransferVehicleDto) {
    return this.vehiclesService.transferVehicle(param.id, dto);
  }

  @Post(':id/pair')
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate or validate 6-digit telemetry pairing code' })
  @ApiResponse({ status: 200, description: 'Pairing code generated or validated successfully' })
  async pairVehicle(@Param() param: UuidParamDto, @Body() dto: PairVehicleDto) {
    return this.vehiclesService.pairVehicle(param.id, dto);
  }

  @Post(':id/unpair')
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke active telemetry pairing for a Vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle pairing revoked successfully' })
  async unpairVehicle(@Param() param: UuidParamDto) {
    return this.vehiclesService.unpairVehicle(param.id);
  }

  @Post(':id/change-status')
  @Permissions(PermissionEnum.VEHICLE_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change Vehicle status with lifecycle transition validation' })
  @ApiResponse({ status: 200, description: 'Vehicle status changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition rule violation' })
  async changeStatus(@Param() param: UuidParamDto, @Body() dto: ChangeVehicleStatusDto) {
    return this.vehiclesService.changeStatus(param.id, dto);
  }
}
