import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { RoleEnum, UserStatus } from '@app/common';
import { PaginationDto } from './pagination.dto';

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'john.doe@enterprise.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ enum: RoleEnum, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(RoleEnum, { each: true })
  roles?: RoleEnum[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'https://cdn.enterprise.com/profiles/johndoe.jpg' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: RoleEnum, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(RoleEnum, { each: true })
  roles?: RoleEnum[];
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'https://cdn.enterprise.com/profiles/johndoe.jpg' })
  @IsOptional()
  @IsString()
  profileImage?: string;
}

export class UserQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for name, email, or username' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: RoleEnum })
  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;
}

export class UserResponseDto {
  @ApiProperty({ example: 'd3b07384-d113-46a6-a719-8686a635832a' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'john.doe@enterprise.com' })
  email: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'https://cdn.enterprise.com/profiles/johndoe.jpg' })
  profileImage?: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ example: true })
  emailVerified: boolean;

  @ApiPropertyOptional({ example: ['ADMIN', 'FLEET_MANAGER'] })
  roles: string[];

  @ApiPropertyOptional({ example: ['USER_MANAGEMENT', 'FLEET_MANAGEMENT'] })
  permissions: string[];

  @ApiProperty({ example: '2026-07-27T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-27T12:00:00.000Z' })
  updatedAt: Date;
}
