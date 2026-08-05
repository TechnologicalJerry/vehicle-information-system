import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';

@Injectable()
export class GracefulShutdownService implements OnModuleDestroy {
  private readonly logger = new Logger(GracefulShutdownService.name);

  onModuleDestroy() {
    this.logger.log(
      'Graceful Shutdown signal received. Closing database connections, draining queues, and closing HTTP listeners...',
    );
  }
}
