import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AppMongooseModule } from './mongoose/mongoose.module';

@Module({
  imports: [PrismaModule, AppMongooseModule],
  exports: [PrismaModule, AppMongooseModule],
})
export class DatabaseModule {}
