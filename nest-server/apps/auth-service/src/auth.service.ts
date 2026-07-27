import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/database';
import { RedisService } from '@app/cache';
import { BcryptUtilsService, AuthUtilsService } from '@app/auth';
import { KafkaProducerService } from '@app/kafka';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from '@app/dto';
import {
  ApiResponseInterface,
  ResponseHelper,
  AUTH_CONSTANTS,
  UserStatus,
  RoleEnum,
} from '@app/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly bcryptUtils: BcryptUtilsService,
    private readonly authUtils: AuthUtilsService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async register(dto: RegisterDto): Promise<ApiResponseInterface> {
    this.bcryptUtils.validatePasswordStrength(dto.password);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, { username: dto.username.toLowerCase() }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or username is already registered');
    }

    const passwordHash = await this.bcryptUtils.hashPassword(dto.password);

    const defaultRole = await this.prisma.role.findUnique({
      where: { name: RoleEnum.OPERATOR },
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
        emailVerified: false,
        userRoles: defaultRole
          ? {
              create: {
                roleId: defaultRole.id,
              },
            }
          : undefined,
        passwordHistories: {
          create: {
            passwordHash,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const verificationTokenStr = this.authUtils.generateRandomToken(32);
    const tokenHash = this.authUtils.hashToken(verificationTokenStr);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + AUTH_CONSTANTS.VERIFICATION_TOKEN_EXPIRATION_HOURS);

    await this.prisma.verificationToken.create({
      data: {
        email: user.email,
        tokenHash,
        expiresAt,
      },
    });

    this.logger.log(`User registered successfully: [${user.email}]`);
    await this.kafkaProducer.emit('vis.user.registered', {
      userId: user.id,
      email: user.email,
      username: user.username,
      verificationToken: verificationTokenStr,
    });

    return ResponseHelper.success(
      this.authUtils.sanitizeUser(user),
      'User registered successfully. Please verify your email.',
      201,
    );
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ApiResponseInterface> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.usernameOrEmail.toLowerCase() },
          { username: dto.usernameOrEmail.toLowerCase() },
        ],
        deletedAt: null,
      },
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
      this.logger.warn(`Failed login attempt for non-existent user: [${dto.usernameOrEmail}]`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.LOCKED || user.status === UserStatus.SUSPENDED) {
      if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
        throw new ForbiddenException(
          `Account is locked until ${user.accountLockedUntil.toISOString()}`,
        );
      } else if (user.accountLockedUntil && new Date() >= user.accountLockedUntil) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { status: UserStatus.ACTIVE, failedLoginAttempts: 0, accountLockedUntil: null },
        });
      }
    }

    const isValidPassword = await this.bcryptUtils.comparePassword(dto.password, user.passwordHash);

    if (!isValidPassword) {
      const attempts = user.failedLoginAttempts + 1;
      let updateData: any = { failedLoginAttempts: attempts };

      if (attempts >= AUTH_CONSTANTS.MAX_FAILED_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date();
        lockedUntil.setMinutes(
          lockedUntil.getMinutes() + AUTH_CONSTANTS.ACCOUNT_LOCKOUT_DURATION_MINUTES,
        );
        updateData = {
          ...updateData,
          status: UserStatus.LOCKED,
          accountLockedUntil: lockedUntil,
        };
        this.logger.warn(`User account locked due to failed attempts: [${user.email}]`);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, accountLockedUntil: null, lastLogin: new Date() },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => permissionsSet.add(rp.permission.name));
    });
    const permissions = Array.from(permissionsSet);

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.username,
      roles,
      permissions,
    );

    const refreshTokenHash = this.authUtils.hashToken(tokens.refreshToken);
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        ipAddress: ipAddress || '127.0.0.1',
        device: userAgent || 'Unknown Device',
        expiresAt: sessionExpiresAt,
      },
    });

    this.logger.log(`Successful login for user: [${user.email}]`);
    return ResponseHelper.success(
      {
        user: this.authUtils.sanitizeUser(user),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 900,
        },
        sessionId: session.id,
      },
      'Login successful',
    );
  }

  async logout(userId: string, sessionId?: string): Promise<ApiResponseInterface> {
    if (sessionId) {
      await this.prisma.session.updateMany({
        where: { id: sessionId, userId },
        data: { revokedAt: new Date() },
      });
      await this.redisService.set(`revoked_session:${sessionId}`, 'true', 7 * 86400);
    } else {
      await this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    this.logger.log(`User logged out: [userId=${userId}]`);
    return ResponseHelper.success(null, 'Logout successful');
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<ApiResponseInterface> {
    const tokenHash = this.authUtils.hashToken(dto.refreshToken);

    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      include: {
        user: {
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
        },
      },
    });

    if (!session || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = session.user;
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => permissionsSet.add(rp.permission.name));
    });

    const newTokens = await this.generateTokens(
      user.id,
      user.email,
      user.username,
      roles,
      Array.from(permissionsSet),
      session.id,
    );

    const newRefreshTokenHash = this.authUtils.hashToken(newTokens.refreshToken);
    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash: newRefreshTokenHash },
    });

    return ResponseHelper.success(newTokens, 'Token refreshed successfully');
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<ApiResponseInterface> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        passwordHistories: {
          take: AUTH_CONSTANTS.PASSWORD_HISTORY_LIMIT,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await this.bcryptUtils.comparePassword(dto.oldPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    this.bcryptUtils.validatePasswordStrength(dto.newPassword);

    const previousHashes = user.passwordHistories.map((ph) => ph.passwordHash);
    await this.bcryptUtils.checkPasswordReuse(dto.newPassword, previousHashes);

    const newPasswordHash = await this.bcryptUtils.hashPassword(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordHistory.create({
        data: { userId, passwordHash: newPasswordHash },
      }),
    ]);

    this.logger.log(`Password changed for user: [${user.email}]`);
    return ResponseHelper.success(null, 'Password changed successfully');
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<ApiResponseInterface> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (user) {
      const resetTokenStr = this.authUtils.generateRandomToken(32);
      const tokenHash = this.authUtils.hashToken(resetTokenStr);
      const expiresAt = new Date();
      expiresAt.setMinutes(
        expiresAt.getMinutes() + AUTH_CONSTANTS.PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES,
      );

      await this.prisma.passwordResetToken.create({
        data: {
          email: user.email,
          tokenHash,
          expiresAt,
        },
      });

      this.logger.log(`Password reset token generated for user: [${user.email}]`);
      await this.kafkaProducer.emit('vis.user.forgot_password', {
        email: user.email,
        resetToken: resetTokenStr,
      });
    }

    return ResponseHelper.success(
      null,
      'If your email is registered, a password reset link has been sent.',
    );
  }

  async resetPassword(dto: ResetPasswordDto): Promise<ApiResponseInterface> {
    const tokenHash = this.authUtils.hashToken(dto.token);

    const resetTokenRecord = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash },
    });

    if (!resetTokenRecord || new Date() > resetTokenRecord.expiresAt) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: resetTokenRecord.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.bcryptUtils.validatePasswordStrength(dto.newPassword);
    const newPasswordHash = await this.bcryptUtils.hashPassword(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash, failedLoginAttempts: 0, status: UserStatus.ACTIVE },
      }),
      this.prisma.passwordResetToken.delete({ where: { id: resetTokenRecord.id } }),
      this.prisma.passwordHistory.create({
        data: { userId: user.id, passwordHash: newPasswordHash },
      }),
    ]);

    return ResponseHelper.success(
      null,
      'Password has been reset successfully. Please login with your new password.',
    );
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<ApiResponseInterface> {
    const tokenHash = this.authUtils.hashToken(dto.token);

    const tokenRecord = await this.prisma.verificationToken.findFirst({
      where: { tokenHash },
    });

    if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
      throw new BadRequestException('Invalid or expired email verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email: tokenRecord.email },
        data: { emailVerified: true },
      }),
      this.prisma.verificationToken.delete({ where: { id: tokenRecord.id } }),
    ]);

    return ResponseHelper.success(null, 'Email verified successfully.');
  }

  async resendVerificationEmail(dto: ResendVerificationDto): Promise<ApiResponseInterface> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });

    if (user && !user.emailVerified) {
      const verificationTokenStr = this.authUtils.generateRandomToken(32);
      const tokenHash = this.authUtils.hashToken(verificationTokenStr);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + AUTH_CONSTANTS.VERIFICATION_TOKEN_EXPIRATION_HOURS);

      await this.prisma.verificationToken.create({
        data: { email: user.email, tokenHash, expiresAt },
      });

      await this.kafkaProducer.emit('vis.user.resend_verification', {
        email: user.email,
        verificationToken: verificationTokenStr,
      });
    }

    return ResponseHelper.success(
      null,
      'Verification email sent if account exists and is unverified.',
    );
  }

  async getCurrentUser(userId: string): Promise<ApiResponseInterface> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
      throw new NotFoundException('User not found');
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

  private async generateTokens(
    userId: string,
    email: string,
    username: string,
    roles: string[],
    permissions: string[],
    sessionId?: string,
  ) {
    const payload = {
      sub: userId,
      email,
      username,
      roles,
      permissions,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshTokenSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'vis-refresh-secret';
    const refreshToken = this.jwtService.sign(
      { sub: userId, sessionId },
      { secret: refreshTokenSecret, expiresIn: '7d' },
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
