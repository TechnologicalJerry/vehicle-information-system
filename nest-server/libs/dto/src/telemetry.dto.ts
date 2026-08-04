import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class CreateTelemetryDto {
  @ApiProperty({ example: 'd3b07384-d113-46a6-a719-8686a635832a', description: 'UUID of Vehicle' })
  @IsUUID('4')
  vehicleId: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  fleetId?: string;

  @ApiPropertyOptional({ example: '2026-07-27T16:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiProperty({ example: 37.7749, description: 'Latitude degree (-90 to 90)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: -122.4194, description: 'Longitude degree (-180 to 180)' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ example: 15.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  altitude?: number;

  @ApiPropertyOptional({ example: 180.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  heading?: number;

  @ApiPropertyOptional({ example: 65.5, description: 'Speed in km/h' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiPropertyOptional({ example: 2200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rpm?: number;

  @ApiPropertyOptional({ example: 12500.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  odometer?: number;

  @ApiPropertyOptional({ example: 85.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fuelLevel?: number;

  @ApiPropertyOptional({ example: 92.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  batteryLevel?: number;

  @ApiPropertyOptional({ example: 400.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  batteryVoltage?: number;

  @ApiPropertyOptional({ example: 90.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  coolantTemperature?: number;

  @ApiPropertyOptional({ example: 95.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  engineTemperature?: number;

  @ApiPropertyOptional({ example: 35.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  oilPressure?: number;

  @ApiPropertyOptional({ example: 32.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tyrePressureFrontLeft?: number;

  @ApiPropertyOptional({ example: 32.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tyrePressureFrontRight?: number;

  @ApiPropertyOptional({ example: 32.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tyrePressureRearLeft?: number;

  @ApiPropertyOptional({ example: 32.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tyrePressureRearRight?: number;

  @ApiPropertyOptional({ example: 'RUNNING' })
  @IsOptional()
  @IsString()
  engineStatus?: string;

  @ApiPropertyOptional({ example: 'ON' })
  @IsOptional()
  @IsString()
  ignitionStatus?: string;

  @ApiPropertyOptional({ example: 'D' })
  @IsOptional()
  @IsString()
  gear?: string;

  @ApiPropertyOptional({ example: 25.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  acceleratorPosition?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  brakeStatus?: boolean;

  @ApiPropertyOptional({ example: 'CLOSED' })
  @IsOptional()
  @IsString()
  doorStatus?: string;

  @ApiPropertyOptional({ example: 'FASTENED' })
  @IsOptional()
  @IsString()
  seatbeltStatus?: string;

  @ApiPropertyOptional({ example: 'DISCONNECTED' })
  @IsOptional()
  @IsString()
  chargingStatus?: string;

  @ApiPropertyOptional({ example: -75 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  signalStrength?: number;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsAccuracy?: number;

  @ApiPropertyOptional({ example: 'REST' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  rawPayload?: Record<string, any>;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BulkTelemetryDto {
  @ApiProperty({ type: [CreateTelemetryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTelemetryDto)
  events: CreateTelemetryDto[];
}

export class TelemetryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  fleetId?: string;

  @ApiPropertyOptional({ example: '2026-07-27T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-27T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minSpeed?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSpeed?: number;

  @ApiPropertyOptional({ example: 'RUNNING' })
  @IsOptional()
  @IsString()
  engineStatus?: string;
}

export class TelemetryStatsQueryDto {
  @ApiPropertyOptional({ example: '2026-07-27T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-27T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
