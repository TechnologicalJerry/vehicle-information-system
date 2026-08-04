import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { TripStatus } from '@app/common';
import { PaginationDto } from './pagination.dto';

export class StartTripDto {
  @ApiProperty({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsUUID('4')
  vehicleId: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  fleetId?: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  driverId?: string;

  @ApiProperty({ example: 37.7749 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  startLatitude: number;

  @ApiProperty({ example: -122.4194 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  startLongitude: number;
}

export class EndTripDto {
  @ApiProperty({ example: 37.7833 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  endLatitude: number;

  @ApiProperty({ example: -122.4167 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  endLongitude: number;

  @ApiPropertyOptional({ example: 12.5, description: 'Total distance in kilometers' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distance?: number;
}

export class TripQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  fleetId?: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  driverId?: string;

  @ApiPropertyOptional({ enum: TripStatus })
  @IsOptional()
  @IsEnum(TripStatus)
  tripStatus?: TripStatus;

  @ApiPropertyOptional({ example: '2026-07-27T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-27T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class TripStatsQueryDto {
  @ApiPropertyOptional({ example: '2026-07-27T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-27T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
