import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppConfigModule } from '@app/config';
import { LoggerModule, CorrelationIdMiddleware } from '@app/logger';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';
import { AppMqttModule } from '@app/mqtt';
import { SharedAuthModule } from '@app/auth';
import { CommonModule } from '@app/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from '../../auth-service/src/auth.module';
import { UsersModule } from '../../user-service/src/users/users.module';
import { FleetsModule } from '../../fleet-service/src/fleets/fleets.module';
import { VehiclesModule } from '../../vehicle-service/src/vehicles/vehicles.module';
import { TelemetryModule } from '../../telemetry-service/src/telemetry/telemetry.module';
import { LocationsModule } from '../../location-service/src/locations/locations.module';
import { GeofencesModule } from '../../location-service/src/geofences/geofences.module';
import { TripsModule } from '../../trip-service/src/trips/trips.module';
import { DiagnosticsModule } from '../../diagnostics-service/src/diagnostics/diagnostics.module';
import { DriverBehaviourModule } from '../../driver-behaviour-service/src/driver-behaviour/driver-behaviour.module';
import { RemoteCommandModule } from '../../remote-command-service/src/commands/remote-command.module';
import { OtaModule } from '../../ota-service/src/ota/ota.module';
import { NotificationModule } from '../../notification-service/src/notifications/notification.module';
import { AnalyticsModule } from '../../analytics-service/src/analytics/analytics.module';
import { ReportModule } from '../../reporting-service/src/reports/report.module';
import { AuditModule } from '../../audit-service/src/audit/audit.module';
import { AdminModule } from '../../admin-service/src/admin/admin.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    CommonModule,
    SharedAuthModule,
    DatabaseModule,
    RedisCacheModule,
    AppKafkaModule,
    AppMqttModule,
    HealthModule,
    AuthModule,
    UsersModule,
    FleetsModule,
    VehiclesModule,
    TelemetryModule,
    LocationsModule,
    GeofencesModule,
    TripsModule,
    DiagnosticsModule,
    DriverBehaviourModule,
    RemoteCommandModule,
    OtaModule,
    NotificationModule,
    AnalyticsModule,
    ReportModule,
    AuditModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
