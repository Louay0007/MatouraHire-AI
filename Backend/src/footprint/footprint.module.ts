import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { FootprintController } from './footprint.controller';
import { FootprintService } from './footprint.service';
import { FootprintLog, FootprintLogSchema } from './schemas/footprint-log.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: FootprintLog.name, schema: FootprintLogSchema }])
  ],
  controllers: [FootprintController],
  providers: [FootprintService]
})
export class FootprintModule {}
