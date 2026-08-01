import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SharedAuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [SharedAuthModule, DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
