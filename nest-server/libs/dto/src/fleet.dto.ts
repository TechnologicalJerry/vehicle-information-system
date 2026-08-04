import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { FleetStatus } from '@app/common';
import { PaginationDto } from './pagination.dto';

export class CreateFleetDto {
  @ApiProperty({ example: 'ORG-001' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ example: 'FLEET-NORTH-01' })
  @IsString()
  @IsNotEmpty()
  fleetCode: string;

  @ApiProperty({ example: 'North Region Logistics Fleet' })
  @IsString()
  @IsNotEmpty()
  fleetName: string;

  @ApiPropertyOptional({ example: 'Primary fleet serving North region distribution' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  managerId?: string;

  @ApiPropertyOptional({ example: { region: 'North', depot: 'Depot-A' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateFleetDto {
  @ApiPropertyOptional({ example: 'North Region Commercial Fleet' })
  @IsOptional()
  @IsString()
  fleetName?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: FleetStatus })
  @IsOptional()
  @IsEnum(FleetStatus)
  status?: FleetStatus;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  managerId?: string;

  @ApiPropertyOptional({ example: { region: 'North', depot: 'Depot-B' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class FleetQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for fleet code or fleet name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: FleetStatus })
  @IsOptional()
  @IsEnum(FleetStatus)
  status?: FleetStatus;

  @ApiPropertyOptional({ example: 'ORG-001' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}
