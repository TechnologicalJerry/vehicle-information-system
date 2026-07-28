import { NestFactory } from '@nestjs/core';
import { VersioningType, Logger as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  const port = configService.get<number>('PORT', 3000);
  const globalPrefix = configService.get<string>('GLOBAL_PREFIX', 'api');
  const apiVersion = configService.get<string>('API_VERSION', 'v1');
  const appName = configService.get<string>('APP_NAME', 'Vehicle Information System');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  const rateLimitTtl = configService.get<number>('RATE_LIMIT_TTL', 60000);
  const rateLimitLimit = configService.get<number>('RATE_LIMIT_LIMIT', 100);

  // Security & Middleware
  app.use(helmet());
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.use(compression());

  app.use(
    rateLimit({
      windowMs: rateLimitTtl,
      max: rateLimitLimit,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Global Prefix & Versioning
  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle(appName)
    .setDescription('Production-Grade Vehicle Information System API Gateway Workspace')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health & Operations', 'System readiness and dependency checks')
    .addTag(
      'Authentication',
      'User registration, login, JWT token rotation, and password management',
    )
    .addTag('Users & Identity', 'User CRUD, RBAC role management, and profile management')
    .addTag(
      'Fleet Management',
      'Fleet organization, fleet statistics, and fleet lifecycle management',
    )
    .addTag(
      'Vehicle Management',
      'VIN validation, vehicle CRUD, driver assignment, vehicle pairing, and status transitions',
    )
    .addTag(
      'Telemetry Platform',
      'Real-time telemetry ingestion, MongoDB time-series storage, Redis state caching, and Socket.IO WebSocket broadcasting',
    )
    .addTag(
      'Location & Tracking',
      'Live vehicle location tracking, route history, and spatial bounding box search',
    )
    .addTag('Geofencing', 'Circle and Polygon geofence management and spatial breach detection')
    .addTag(
      'Trip Management & Analytics',
      'Automatic trip detection engine, trip history, route trajectory, and aggregate trip analytics',
    )
    .addTag(
      'Vehicle Diagnostics & Maintenance',
      'Vehicle health scoring (0-100), DTC detection engine, and maintenance recommendations',
    )
    .addTag(
      'Driver Behaviour Analytics & Safety Scoring',
      'Driver safety score calculation (0-100), safety violation detection, and fleet rankings',
    )
    .addTag(
      'Remote Vehicle Commands',
      'Secure remote vehicle control, idempotent command priority queue & MQTT dispatch',
    )
    .addTag(
      'OTA Updates & Firmware Management',
      'Firmware SHA-256 validation, staged campaign fleet rollout & automatic rollback management',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Graceful Shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  NestLogger.log(
    `🚀 API Gateway is running on: http://localhost:${port}/${globalPrefix}/${apiVersion}`,
    'Bootstrap',
  );
  NestLogger.log(
    `📚 Swagger Documentation available at: http://localhost:${port}/docs`,
    'Bootstrap',
  );
}

bootstrap();
