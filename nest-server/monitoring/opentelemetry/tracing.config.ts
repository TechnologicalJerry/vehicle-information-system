import { Logger } from '@nestjs/common';

export const configureOpenTelemetry = () => {
  const logger = new Logger('OpenTelemetry');
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
  logger.log(`OpenTelemetry instrumentation initialized. Exporting traces to [${endpoint}]`);
};
