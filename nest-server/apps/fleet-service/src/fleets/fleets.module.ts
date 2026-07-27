import { Module } from '@nestjs/common';
import { FleetsController } from './fleets.controller';
import { FleetsService } from './fleets.service';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { AppKafkaModule } from '@app/kafka';

@Module({
  imports: [SharedAuthModule, DatabaseModule, AppKafkaModule],
  controllers: [FleetsController],
  providers: [FleetsService],
  exports: [FleetsService],
})
export class FleetsModule {}
