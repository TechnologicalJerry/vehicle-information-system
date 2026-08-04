import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { CommandType, CommandPriority, CommandStatus } from '@app/common';
import { PaginationDto } from './pagination.dto';

export class CreateCommandDto {
  @ApiProperty({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsUUID('4')
  vehicleId: string;

  @ApiProperty({ enum: CommandType, example: CommandType.LOCK_DOORS })
  @IsEnum(CommandType)
  commandType: CommandType;

  @ApiPropertyOptional({ example: { door: 'ALL' } })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @ApiPropertyOptional({ enum: CommandPriority, default: CommandPriority.MEDIUM })
  @IsOptional()
  @IsEnum(CommandPriority)
  priority?: CommandPriority;

  @ApiPropertyOptional({ example: 'MOBILE_APP' })
  @IsOptional()
  @IsString()
  requestSource?: string;
}

export class CommandQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;

  @ApiPropertyOptional({ enum: CommandType })
  @IsOptional()
  @IsEnum(CommandType)
  commandType?: CommandType;

  @ApiPropertyOptional({ enum: CommandStatus })
  @IsOptional()
  @IsEnum(CommandStatus)
  status?: CommandStatus;

  @ApiPropertyOptional({ example: 'cmd-correlation-123' })
  @IsOptional()
  @IsString()
  correlationId?: string;
}
