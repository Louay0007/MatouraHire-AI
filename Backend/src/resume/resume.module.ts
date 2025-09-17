import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';

@Module({
  imports: [HttpModule],
  controllers: [ResumeController],
  providers: [ResumeService]
})
export class ResumeModule {}
