import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ReportType, ExportFormat, ReportStatus } from '@app/common';
import { PaginationDto } from './pagination.dto';

export class CreateReportDto {
  @ApiProperty({ example: 'Fleet Performance Q3 Report' })
  @IsString()
  @IsNotEmpty()
  reportName: string;

  @ApiProperty({ enum: ReportType, default: ReportType.FLEET })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.CSV })
  @IsOptional()
  @IsEnum(ExportFormat)
  exportFormat?: ExportFormat;

  @ApiPropertyOptional({ example: { fleetId: 'd3b07384-d113-46a6-a719-8686a635832a' } })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

export class ExportReportDto {
  @ApiProperty({ enum: ReportType, default: ReportType.FLEET })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ enum: ExportFormat, default: ExportFormat.CSV })
  @IsEnum(ExportFormat)
  exportFormat: ExportFormat;

  @ApiPropertyOptional({ example: { fleetId: 'd3b07384-d113-46a6-a719-8686a635832a' } })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

export class ScheduleReportDto {
  @ApiProperty({ example: 'Weekly Maintenance Summary' })
  @IsString()
  @IsNotEmpty()
  reportName: string;

  @ApiProperty({ enum: ReportType, default: ReportType.MAINTENANCE })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ enum: ExportFormat, default: ExportFormat.PDF })
  @IsEnum(ExportFormat)
  exportFormat: ExportFormat;

  @ApiProperty({ example: '0 0 * * 0' })
  @IsString()
  @IsNotEmpty()
  cronExpression: string;

  @ApiProperty({ example: ['fleet.admin@enterprise.com'] })
  @IsArray()
  @IsString({ each: true })
  recipientEmails: string[];
}

export class ReportQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReportType })
  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType;

  @ApiPropertyOptional({ enum: ExportFormat })
  @IsOptional()
  @IsEnum(ExportFormat)
  exportFormat?: ExportFormat;

  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
