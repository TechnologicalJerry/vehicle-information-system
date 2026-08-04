import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
} from '@app/common';
import { PaginationDto } from './pagination.dto';

export class CreateNotificationDto {
  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  fleetId?: string;

  @ApiProperty({ enum: NotificationChannel, default: NotificationChannel.IN_APP })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ enum: NotificationCategory, default: NotificationCategory.SYSTEM })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiProperty({ example: 'Critical DTC Alert - Engine Coolant Over Temperature' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Vehicle VIN-12345 reported coolant temperature 115°C.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ example: { dtcCode: 'P0217' } })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @ApiPropertyOptional({ enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'dtc_critical_alert' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: NotificationChannel, default: NotificationChannel.EMAIL })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ example: 'Vehicle Diagnostic Alert: {{dtcCode}}' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Dear {{userName}}, vehicle {{vin}} detected {{title}}.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ example: ['userName', 'vin', 'dtcCode', 'title'] })
  @IsArray()
  @IsString({ each: true })
  variables: string[];
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ example: 'Updated Subject: {{title}}' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: 'Updated Body: {{body}}' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class NotificationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional({ enum: NotificationStatus })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
