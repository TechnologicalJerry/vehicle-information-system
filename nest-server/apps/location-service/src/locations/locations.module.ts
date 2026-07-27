import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { LocationsKafkaConsumer } from './locations.consumer';
import { GeofencesModule } from '../geofences/geofences.module';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { RedisCacheModule } from '@app/cache';
import { AppKafkaModule } from '@app/kafka';

@Module({
  imports: [SharedAuthModule, DatabaseModule, RedisCacheModule, AppKafkaModule, GeofencesModule],
  controllers: [LocationsController],
  providers: [LocationsService, LocationsKafkaConsumer],
  exports: [LocationsService],
})
export class LocationsModule {}
