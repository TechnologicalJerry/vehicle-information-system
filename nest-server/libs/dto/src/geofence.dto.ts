import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { GeofenceType } from '@app/common';

export class CreateGeofenceDto {
  @ApiProperty({ example: 'd3b07384-d113-46a6-a719-8686a635832a', description: 'UUID of Fleet' })
  @IsUUID('4')
  fleetId: string;

  @ApiProperty({ example: 'North Logistics Depot Boundary' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: GeofenceType, example: GeofenceType.CIRCLE })
  @IsEnum(GeofenceType)
  type: GeofenceType;

  @ApiPropertyOptional({ example: [-122.4194, 37.7749], description: '[longitude, latitude]' })
  @IsOptional()
  @IsArray()
  center?: number[];

  @ApiPropertyOptional({ example: 500.0, description: 'Radius in meters for CIRCLE type' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radius?: number;

  @ApiPropertyOptional({
    example: [
      [
        [-122.42, 37.77],
        [-122.41, 37.77],
        [-122.41, 37.78],
        [-122.42, 37.78],
        [-122.42, 37.77],
      ],
    ],
    description: 'Polygon coordinates ring array for POLYGON type',
  })
  @IsOptional()
  @IsArray()
  polygonCoordinates?: number[][][];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateGeofenceDto {
  @ApiPropertyOptional({ example: 'Updated Depot Geofence Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 750.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
