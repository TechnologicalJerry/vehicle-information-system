import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions, CurrentUser } from '@app/auth';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  UserQueryDto,
  UuidParamDto,
} from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Users & Identity')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions(PermissionEnum.USER_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of users (Requires USER_MANAGEMENT permission)' })
  @ApiResponse({ status: 200, description: 'Paginated user list returned' })
  async findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current logged in user profile' })
  @ApiResponse({ status: 200, description: 'Profile details returned' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current logged in user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get(':id')
  @Permissions(PermissionEnum.USER_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get specific user by ID (Requires USER_MANAGEMENT permission)' })
  @ApiResponse({ status: 200, description: 'User details returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param() param: UuidParamDto) {
    return this.usersService.findById(param.id);
  }

  @Post()
  @Permissions(PermissionEnum.USER_MANAGEMENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create user with assigned roles (Requires USER_MANAGEMENT permission)',
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Patch(':id')
  @Permissions(PermissionEnum.USER_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user details or assigned roles (Requires USER_MANAGEMENT permission)',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param() param: UuidParamDto, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(param.id, dto);
  }

  @Delete(':id')
  @Permissions(PermissionEnum.USER_MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete user account & revoke sessions (Requires USER_MANAGEMENT permission)',
  })
  @ApiResponse({ status: 200, description: 'User soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param() param: UuidParamDto) {
    return this.usersService.deleteUser(param.id);
  }
}
