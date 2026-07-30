import { Controller, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions } from '@app/auth';
import { AuditQueryDto, UuidParamDto } from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Immutable Audit History & Compliance Trail')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions(PermissionEnum.AUDIT_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query append-only immutable audit history logs with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Audit logs returned' })
  async findAll(@Query() query: AuditQueryDto) {
    return this.auditService.findAllAudits(query);
  }

  @Get('search')
  @Permissions(PermissionEnum.AUDIT_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search audit records by correlation ID, action, or entity type' })
  @ApiResponse({ status: 200, description: 'Matching audit logs returned' })
  async search(@Query('q') searchTerm: string) {
    return this.auditService.searchAudits(searchTerm || '');
  }

  @Get('entity/:entityId')
  @Permissions(PermissionEnum.AUDIT_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get full audit history trail for a specific entity (vehicle, user, fleet)',
  })
  @ApiResponse({ status: 200, description: 'Entity audit logs returned' })
  async findByEntity(@Param('entityId') entityId: string) {
    return this.auditService.findAuditsByEntity(entityId);
  }

  @Get('user/:userId')
  @Permissions(PermissionEnum.AUDIT_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit logs of all actions performed by a specific user' })
  @ApiResponse({ status: 200, description: 'User audit logs returned' })
  async findByUser(@Param('userId') userId: string) {
    return this.auditService.findAuditsByUser(userId);
  }

  @Get('service/:service')
  @Permissions(PermissionEnum.AUDIT_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit events produced by a specific microservice' })
  @ApiResponse({ status: 200, description: 'Service audit logs returned' })
  async findByService(@Param('service') service: string) {
    return this.auditService.findAuditsByService(service);
  }

  @Get(':id')
  @Permissions(PermissionEnum.AUDIT_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit record details by ID including extended MongoDB metadata' })
  @ApiResponse({ status: 200, description: 'Audit log details returned' })
  async findOne(@Param() param: UuidParamDto) {
    return this.auditService.findAuditById(param.id);
  }
}
