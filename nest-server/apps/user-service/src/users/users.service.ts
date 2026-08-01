import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { BcryptUtilsService, AuthUtilsService } from '@app/auth';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto, UserQueryDto } from '@app/dto';
import { ApiResponseInterface, ResponseHelper, UserStatus, RoleEnum } from '@app/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bcryptUtils: BcryptUtilsService,
    private readonly authUtils: AuthUtilsService,
  ) {}

  async findAll(query: UserQueryDto): Promise<ApiResponseInterface> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.userRoles = {
        some: {
          role: {
            name: query.role,
          },
        },
      };
    }

    const [users, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const sanitizedUsers = users.map((u) => ({
      ...this.authUtils.sanitizeUser(u),
      roles: u.userRoles.map((ur) => ur.role.name),
    }));

    return ResponseHelper.success(sanitizedUsers, 'Users fetched successfully', 200, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  }

  async findById(id: string): Promise<ApiResponseInterface> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => permissionsSet.add(rp.permission.name));
    });

    return ResponseHelper.success({
      ...this.authUtils.sanitizeUser(user),
      roles,
      permissions: Array.from(permissionsSet),
    });
  }

  async createUser(dto: CreateUserDto): Promise<ApiResponseInterface> {
    this.bcryptUtils.validatePasswordStrength(dto.password);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, { username: dto.username.toLowerCase() }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    const passwordHash = await this.bcryptUtils.hashPassword(dto.password);

    const rolesToAssign = dto.roles && dto.roles.length > 0 ? dto.roles : [RoleEnum.OPERATOR];
    const rolesRecords = await this.prisma.role.findMany({
      where: { name: { in: rolesToAssign } },
    });

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username.toLowerCase(),
        email: dto.email.toLowerCase(),
        phoneNumber: dto.phoneNumber,
        passwordHash,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        userRoles: {
          create: rolesRecords.map((r) => ({ roleId: r.id })),
        },
        passwordHistories: {
          create: { passwordHash },
        },
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    this.logger.log(`User created by Admin: [${user.email}]`);
    return ResponseHelper.success(
      {
        ...this.authUtils.sanitizeUser(user),
        roles: user.userRoles.map((ur) => ur.role.name),
      },
      'User created successfully',
      201,
    );
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<ApiResponseInterface> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updateData: any = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      profileImage: dto.profileImage,
      status: dto.status,
    };

    if (dto.roles && dto.roles.length > 0) {
      const rolesRecords = await this.prisma.role.findMany({
        where: { name: { in: dto.roles } },
      });

      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      await this.prisma.userRole.createMany({
        data: rolesRecords.map((r) => ({ userId: id, roleId: r.id })),
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    this.logger.log(`User updated: [${updatedUser.email}]`);
    return ResponseHelper.success({
      ...this.authUtils.sanitizeUser(updatedUser),
      roles: updatedUser.userRoles.map((ur) => ur.role.name),
    });
  }

  async deleteUser(id: string): Promise<ApiResponseInterface> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: UserStatus.SUSPENDED,
      },
    });

    await this.prisma.session.updateMany({
      where: { userId: id },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`User soft deleted: [${user.email}]`);
    return ResponseHelper.success(null, 'User deleted successfully');
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ApiResponseInterface> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        profileImage: dto.profileImage,
      },
    });

    return ResponseHelper.success(
      this.authUtils.sanitizeUser(updatedUser),
      'Profile updated successfully',
    );
  }
}
