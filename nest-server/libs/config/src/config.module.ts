import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { environmentValidationSchema } from './env.validation';
import { appConfig, databaseConfig, redisConfig, kafkaConfig, mqttConfig } from './configuration';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, kafkaConfig, mqttConfig],
      validationSchema: environmentValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
  ],
  exports: [NestConfigModule],
})
export class AppConfigModule {}
