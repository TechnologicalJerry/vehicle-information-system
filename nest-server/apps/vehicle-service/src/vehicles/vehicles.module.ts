import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { AppKafkaModule } from '@app/kafka';
import { VinValidatorService } from '@app/utilities';

@Module({
  imports: [SharedAuthModule, DatabaseModule, AppKafkaModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, VinValidatorService],
  exports: [VehiclesService, VinValidatorService],
})
export class VehiclesModule {}
