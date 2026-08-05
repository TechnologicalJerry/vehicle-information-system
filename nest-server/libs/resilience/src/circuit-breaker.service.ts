import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(options?: CircuitBreakerOptions) {
    this.failureThreshold = options?.failureThreshold || 5;
    this.resetTimeoutMs = options?.resetTimeoutMs || 30000;
  }

  async execute<T>(fn: () => Promise<T>, fallbackFn?: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.logger.warn(
          'Circuit Breaker transitioned to HALF_OPEN state. Testing service recovery...',
        );
      } else {
        this.logger.error('Circuit Breaker is OPEN. Execution blocked.');
        if (fallbackFn) return fallbackFn();
        throw new Error('Circuit Breaker is OPEN. Target service is currently unavailable.');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      if (fallbackFn) return fallbackFn();
      throw err;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.logger.log('Circuit Breaker transitioned to CLOSED state. Normal operation restored.');
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.logger.error(
        `Circuit Breaker tripped to OPEN state after ${this.failureCount} consecutive failures.`,
      );
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
