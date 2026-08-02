import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthUtilsService } from './auth-utils.service';
import { BcryptUtilsService } from './bcrypt-utils.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'vis-super-secret-jwt-key'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [
    AuthUtilsService,
    BcryptUtilsService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    JwtStrategy,
  ],
  exports: [
    PassportModule,
    JwtModule,
    AuthUtilsService,
    BcryptUtilsService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    JwtStrategy,
  ],
})
export class SharedAuthModule {}
