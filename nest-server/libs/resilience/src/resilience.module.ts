import { Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RetryEngine } from './retry.engine';
import { GracefulShutdownService } from './graceful-shutdown.service';

@Module({
  providers: [CircuitBreakerService, RetryEngine, GracefulShutdownService],
  exports: [CircuitBreakerService, RetryEngine, GracefulShutdownService],
})
export class ResilienceModule {}
