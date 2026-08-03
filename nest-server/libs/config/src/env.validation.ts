import * as Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  GLOBAL_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),
  APP_NAME: Joi.string().default('Vehicle Information System'),

  CORS_ORIGIN: Joi.string().default('*'),
  RATE_LIMIT_TTL: Joi.number().default(60000),
  RATE_LIMIT_LIMIT: Joi.number().default(100),

  DATABASE_URL: Joi.string().required(),
  MONGODB_URI: Joi.string().required(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  KAFKA_BROKERS: Joi.string().required(),
  KAFKA_CLIENT_ID: Joi.string().default('vis-client'),
  KAFKA_GROUP_ID: Joi.string().default('vis-group'),

  MQTT_URL: Joi.string().required(),
  MQTT_CLIENT_ID: Joi.string().default('vis-mqtt-client'),
  MQTT_USERNAME: Joi.string().allow('').optional(),
  MQTT_PASSWORD: Joi.string().allow('').optional(),

  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
});
