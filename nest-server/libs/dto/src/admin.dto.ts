import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({ example: 'site_name' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Enterprise VIS Platform' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ example: 'GENERAL' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Global site title setting' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'enable_v2_telemetry' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ example: 50, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @ApiPropertyOptional({ example: 'production', default: 'production' })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional({ example: 'Enables high precision MQTT telemetry processing' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Enterprise Analytics Integration Key' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: ['TELEMETRY', 'FLEET_ANALYTICS'] })
  @IsArray()
  @IsString({ each: true })
  scopes: string[];
}

export class CreateWebhookDto {
  @ApiProperty({ example: 'Enterprise SIEM Alert Webhook' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://security.enterprise.com/hooks/vis-alerts' })
  @IsUrl()
  url: string;

  @ApiProperty({ example: ['vis.diagnostic.detected', 'vis.geofence.exited'] })
  @IsArray()
  @IsString({ each: true })
  events: string[];
}
