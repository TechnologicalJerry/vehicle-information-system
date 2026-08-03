import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class AuditQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({ example: 'VEHICLE_SERVICE' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({ example: 'Vehicle' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ example: 'VEHICLE_STATUS_CHANGED' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-28T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
