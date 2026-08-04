import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { VehicleStatus, FuelType, Transmission, VehicleType } from '@app/common';
import { PaginationDto } from './pagination.dto';

export class CreateVehicleDto {
  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  fleetId?: string;

  @ApiProperty({ example: '1HGCR2F83HA000000', description: 'Valid 17-character ISO 3779 VIN' })
  @IsString()
  @IsNotEmpty()
  vin: string;

  @ApiProperty({ example: 'ABC-1234' })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiPropertyOptional({ example: 'CHS-987654' })
  @IsOptional()
  @IsString()
  chassisNumber?: string;

  @ApiPropertyOptional({ example: 'ENG-123456' })
  @IsOptional()
  @IsString()
  engineNumber?: string;

  @ApiProperty({ example: 'Tesla' })
  @IsString()
  @IsNotEmpty()
  manufacturer: string;

  @ApiProperty({ example: 'Model 3' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiPropertyOptional({ example: 'Long Range Dual Motor' })
  @IsOptional()
  @IsString()
  variant?: string;

  @ApiProperty({ example: 2024 })
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  modelYear: number;

  @ApiPropertyOptional({ example: 'Deep Blue Metallic' })
  @IsOptional()
  @IsString()
  colour?: string;

  @ApiPropertyOptional({ enum: FuelType, default: FuelType.ELECTRIC })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @ApiPropertyOptional({ enum: Transmission, default: Transmission.SINGLE_SPEED_EV })
  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @ApiPropertyOptional({ enum: VehicleType, default: VehicleType.SEDAN })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ example: 82.0, description: 'Battery capacity in kWh' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  batteryCapacity?: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  odometer?: number;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'ABC-5678' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'Red Multi-Coat' })
  @IsOptional()
  @IsString()
  colour?: string;

  @ApiPropertyOptional({ example: 12500.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  odometer?: number;

  @ApiPropertyOptional({ example: '2026.24.5' })
  @IsOptional()
  @IsString()
  softwareVersion?: string;

  @ApiPropertyOptional({ example: 'v1.4.2' })
  @IsOptional()
  @IsString()
  firmwareVersion?: string;
}

export class AssignDriverDto {
  @ApiProperty({
    example: 'd3b07384-d113-46a6-a719-8686a635832a',
    description: 'UUID of the Driver user',
  })
  @IsUUID('4')
  driverId: string;
}

export class TransferVehicleDto {
  @ApiProperty({
    example: 'd3b07384-d113-46a6-a719-8686a635832a',
    description: 'UUID of destination Fleet',
  })
  @IsUUID('4')
  newFleetId: string;

  @ApiPropertyOptional({ example: 'Reassigned for regional fleet rebalancing' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class PairVehicleDto {
  @ApiPropertyOptional({ example: '123456', description: '6-digit pairing validation code' })
  @IsOptional()
  @IsString()
  pairingCode?: string;
}

export class ChangeVehicleStatusDto {
  @ApiProperty({ enum: VehicleStatus })
  @IsEnum(VehicleStatus)
  newStatus: VehicleStatus;

  @ApiPropertyOptional({ example: 'Scheduled routine 20k miles inspection' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class VehicleQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search VIN, registration number, make, or model' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: 'Tesla' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  fleetId?: string;
}
