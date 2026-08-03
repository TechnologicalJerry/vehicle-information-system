import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  globalPrefix: process.env.GLOBAL_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',
  name: process.env.APP_NAME || 'Vehicle Information System',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60000,
  rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 100,
}));

export const databaseConfig = registerAs('database', () => ({
  postgresUrl: process.env.DATABASE_URL,
  mongodbUri: process.env.MONGODB_URI,
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
}));

export const kafkaConfig = registerAs('kafka', () => ({
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  clientId: process.env.KAFKA_CLIENT_ID || 'vis-client',
  groupId: process.env.KAFKA_GROUP_ID || 'vis-group',
}));

export const mqttConfig = registerAs('mqtt', () => ({
  url: process.env.MQTT_URL || 'mqtt://localhost:1883',
  clientId: process.env.MQTT_CLIENT_ID || 'vis-mqtt-client',
  username: process.env.MQTT_USERNAME || undefined,
  password: process.env.MQTT_PASSWORD || undefined,
}));
