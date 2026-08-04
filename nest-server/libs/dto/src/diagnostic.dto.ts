import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DtcCategory, DtcSeverity, DtcStatus } from '@app/common';
import { PaginationDto } from './pagination.dto';

export class DiagnosticQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  fleetId?: string;

  @ApiPropertyOptional({ enum: DtcCategory })
  @IsOptional()
  @IsEnum(DtcCategory)
  category?: DtcCategory;

  @ApiPropertyOptional({ enum: DtcSeverity })
  @IsOptional()
  @IsEnum(DtcSeverity)
  severity?: DtcSeverity;

  @ApiPropertyOptional({ enum: DtcStatus })
  @IsOptional()
  @IsEnum(DtcStatus)
  status?: DtcStatus;
}
