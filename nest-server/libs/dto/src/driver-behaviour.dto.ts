import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BehaviourEventType, RankingPeriod } from '@app/common';
import { PaginationDto } from './pagination.dto';

export class DriverBehaviourQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  driverId?: string;

  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;

  @ApiPropertyOptional({ enum: BehaviourEventType })
  @IsOptional()
  @IsEnum(BehaviourEventType)
  eventType?: BehaviourEventType;
}

export class DriverRankingQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  fleetId?: string;

  @ApiPropertyOptional({ enum: RankingPeriod, default: RankingPeriod.MONTHLY })
  @IsOptional()
  @IsEnum(RankingPeriod)
  period?: RankingPeriod;
}
