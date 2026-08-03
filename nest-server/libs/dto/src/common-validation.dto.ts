import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UuidParamDto {
  @ApiProperty({ description: 'Universally Unique Identifier (UUID v4)' })
  @IsUUID('4')
  id: string;
}
