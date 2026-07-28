import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RemoteCommandService } from './remote-command.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions, CurrentUser } from '@app/auth';
import { CreateCommandDto, CommandQueryDto, UuidParamDto } from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Remote Vehicle Commands')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('commands')
export class RemoteCommandController {
  constructor(private readonly remoteCommandService: RemoteCommandService) {}

  @Post()
  @Permissions(PermissionEnum.COMMAND_EXECUTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Send a secure remote command to a vehicle (Lock, Unlock, Engine Start/Stop, Climate, Charging)',
  })
  @ApiResponse({ status: 201, description: 'Command created and dispatched to MQTT broker' })
  async create(@Body() dto: CreateCommandDto, @CurrentUser('id') userId: string) {
    return this.remoteCommandService.createCommand(dto, userId);
  }

  @Post(':id/cancel')
  @Permissions(PermissionEnum.COMMAND_EXECUTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending or queued remote command' })
  @ApiResponse({ status: 200, description: 'Remote command cancelled successfully' })
  async cancel(@Param('id') id: string) {
    return this.remoteCommandService.cancelCommand(id);
  }

  @Get()
  @Permissions(PermissionEnum.COMMAND_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of remote commands with status/vehicle filters' })
  @ApiResponse({ status: 200, description: 'Commands list returned' })
  async findAll(@Query() query: CommandQueryDto) {
    return this.remoteCommandService.findAllCommands(query);
  }

  @Get('statistics')
  @Permissions(PermissionEnum.COMMAND_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get command execution analytics and success rate statistics' })
  @ApiResponse({ status: 200, description: 'Command statistics returned' })
  async getStatistics() {
    return this.remoteCommandService.getCommandStatistics();
  }

  @Get('history/:vehicleId')
  @Permissions(PermissionEnum.COMMAND_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get command execution history for a vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle command history returned' })
  async getVehicleHistory(@Param('vehicleId') vehicleId: string) {
    return this.remoteCommandService.findVehicleCommandHistory(vehicleId);
  }

  @Get(':id')
  @Permissions(PermissionEnum.COMMAND_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get specific command status and details by ID' })
  @ApiResponse({ status: 200, description: 'Command details returned' })
  @ApiResponse({ status: 404, description: 'Command not found' })
  async findOne(@Param() param: UuidParamDto) {
    return this.remoteCommandService.findCommandById(param.id);
  }
}
