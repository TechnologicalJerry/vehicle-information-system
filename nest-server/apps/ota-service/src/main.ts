import { NestFactory } from '@nestjs/core';
import { VersioningType, Logger as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { OtaServiceModule } from './ota-service.module';

async function bootstrap() {
  const app = await NestFactory.create(OtaServiceModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  const port = configService.get<number>('OTA_PORT', 3011);
  const globalPrefix = configService.get<string>('GLOBAL_PREFIX', 'api');
  const apiVersion = configService.get<string>('API_VERSION', 'v1');

  app.use(helmet());
  app.enableCors({ origin: '*', credentials: true });
  app.use(compression());

  app.use(
    rateLimit({
      windowMs: 60000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OTA Updates & Firmware Management Microservice')
    .setDescription(
      'Vehicle Information System - Firmware SHA-256 Validation, Staged Campaign Fleet Rollout & Rollback Management Service',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  app.enableShutdownHooks();

  await app.listen(port);
  NestLogger.log(
    `🚀 OTA Service is running on: http://localhost:${port}/${globalPrefix}/${apiVersion}`,
    'Bootstrap',
  );
}

bootstrap();
