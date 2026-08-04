import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { RolloutType, OtaCampaignStatus, OtaStatus } from '@app/common';
import { PaginationDto } from './pagination.dto';

export class CreateFirmwareDto {
  @ApiProperty({ example: 'v2.5.0' })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({ example: 'OTA Summer Release v2.5' })
  @IsString()
  @IsNotEmpty()
  releaseName: string;

  @ApiPropertyOptional({
    example: 'Optimizes battery thermal management and motor torque response',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' })
  @IsString()
  @IsNotEmpty()
  checksum: string; // SHA-256

  @ApiPropertyOptional({ example: 52428800 })
  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;

  @ApiPropertyOptional({ example: 'Fixes charging curve throttling bug' })
  @IsOptional()
  @IsString()
  releaseNotes?: string;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  @IsDateString()
  releaseDate: string;

  @ApiProperty({ example: ['MODEL_S', 'MODEL_3', 'CYBERTRUCK'] })
  @IsArray()
  @IsString({ each: true })
  supportedModels: string[];

  @ApiPropertyOptional({ example: 'v2.0.0' })
  @IsOptional()
  @IsString()
  minimumVersion?: string;
}

export class CreateCampaignDto {
  @ApiProperty({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsUUID('4')
  firmwareId: string;

  @ApiProperty({ example: 'Global Q3 Fleet Firmware Upgrade' })
  @IsString()
  @IsNotEmpty()
  campaignName: string;

  @ApiPropertyOptional({ enum: RolloutType, default: RolloutType.IMMEDIATE })
  @IsOptional()
  @IsEnum(RolloutType)
  rolloutType?: RolloutType;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class OtaDeployDto {
  @ApiProperty({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsUUID('4')
  campaignId: string;

  @ApiPropertyOptional({ example: ['veh-123', 'veh-456'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vehicleIds?: string[];

  @ApiPropertyOptional({ example: 'fleet-789' })
  @IsOptional()
  @IsUUID('4')
  fleetId?: string;
}

export class OtaRollbackDto {
  @ApiProperty({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsUUID('4')
  vehicleId: string;

  @ApiProperty({ example: 'v2.4.1' })
  @IsString()
  targetVersion: string;
}

export class OtaQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: OtaCampaignStatus })
  @IsOptional()
  @IsEnum(OtaCampaignStatus)
  status?: OtaCampaignStatus;

  @ApiPropertyOptional({ enum: OtaStatus })
  @IsOptional()
  @IsEnum(OtaStatus)
  deploymentStatus?: OtaStatus;
}
