import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { JobMatcherController } from './job-matcher.controller';
import { JobMatcherService } from './job-matcher.service';
import { JobSearchLog, JobSearchLogSchema } from './schemas/job-search-log.schema';
import { CVAnalysisLog, CVAnalysisLogSchema } from './schemas/cv-analysis-log.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: JobSearchLog.name, schema: JobSearchLogSchema },
      { name: CVAnalysisLog.name, schema: CVAnalysisLogSchema },
    ]),
  ],
  controllers: [JobMatcherController],
  providers: [JobMatcherService],
})
export class JobMatcherModule {}
