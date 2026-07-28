import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppConfigModule } from '@app/config';
import { LoggerModule, CorrelationIdMiddleware } from '@app/logger';
import { DriverBehaviourModule } from './driver-behaviour/driver-behaviour.module';
import { GlobalExceptionFilter } from '../../api-gateway/src/filters/global-exception.filter';

@Module({
  imports: [AppConfigModule, LoggerModule, DriverBehaviourModule],
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
export class DriverBehaviourServiceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
