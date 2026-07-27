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
import { FleetsService } from './fleets.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions } from '@app/auth';
import { CreateFleetDto, UpdateFleetDto, FleetQueryDto, UuidParamDto } from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Fleet Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('fleets')
export class FleetsController {
  constructor(private readonly fleetsService: FleetsService) {}

  @Get('statistics')
  @Permissions(PermissionEnum.FLEET_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get Fleet & Vehicle aggregate dashboard statistics (Requires FLEET_MANAGEMENT permission)',
  })
  @ApiResponse({ status: 200, description: 'Fleet statistics returned' })
  async getStatistics() {
    return this.fleetsService.getStatistics();
  }

  @Post()
  @Permissions(PermissionEnum.FLEET_MANAGEMENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new Fleet (Requires FLEET_MANAGEMENT permission)' })
  @ApiResponse({ status: 201, description: 'Fleet created successfully' })
  @ApiResponse({ status: 409, description: 'Fleet code already registered' })
  async create(@Body() dto: CreateFleetDto) {
    return this.fleetsService.createFleet(dto);
  }

  @Get()
  @Permissions(PermissionEnum.FLEET_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of Fleets (Requires FLEET_MANAGEMENT permission)' })
  @ApiResponse({ status: 200, description: 'Fleets list returned' })
  async findAll(@Query() query: FleetQueryDto) {
    return this.fleetsService.findAll(query);
  }

  @Get(':id')
  @Permissions(PermissionEnum.FLEET_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Fleet details by ID (Requires FLEET_MANAGEMENT permission)' })
  @ApiResponse({ status: 200, description: 'Fleet details returned' })
  @ApiResponse({ status: 404, description: 'Fleet not found' })
  async findOne(@Param() param: UuidParamDto) {
    return this.fleetsService.findById(param.id);
  }

  @Patch(':id')
  @Permissions(PermissionEnum.FLEET_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Fleet attributes (Requires FLEET_MANAGEMENT permission)' })
  @ApiResponse({ status: 200, description: 'Fleet updated successfully' })
  @ApiResponse({ status: 404, description: 'Fleet not found' })
  async update(@Param() param: UuidParamDto, @Body() dto: UpdateFleetDto) {
    return this.fleetsService.updateFleet(param.id, dto);
  }

  @Delete(':id')
  @Permissions(PermissionEnum.FLEET_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete Fleet (Requires FLEET_MANAGEMENT permission)' })
  @ApiResponse({ status: 200, description: 'Fleet deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fleet not found' })
  async remove(@Param() param: UuidParamDto) {
    return this.fleetsService.deleteFleet(param.id);
  }
}
