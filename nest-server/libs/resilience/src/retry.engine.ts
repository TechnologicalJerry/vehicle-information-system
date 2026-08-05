import { Injectable, Logger } from '@nestjs/common';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

@Injectable()
export class RetryEngine {
  private readonly logger = new Logger(RetryEngine.name);

  async executeWithRetry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T> {
    const maxRetries = options?.maxRetries || 3;
    const baseDelayMs = options?.baseDelayMs || 1000;
    const maxDelayMs = options?.maxDelayMs || 10000;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (err: any) {
        attempt++;
        if (attempt >= maxRetries) {
          this.logger.error(
            `Operation failed after max retries (${maxRetries}). Error: ${err.message}`,
          );
          throw err;
        }

        const exponentialDelay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
        const jitter = Math.random() * exponentialDelay * 0.5;
        const delay = Math.floor(exponentialDelay + jitter);

        this.logger.warn(
          `Operation failed (Attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error('Retry operation failed unexpectedly');
  }
}
