import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewerController } from './interviewer.controller';
import { InterviewerService } from './interviewer.service';
import { QuestionGenLog, QuestionGenLogSchema } from './schemas/question-gen-log.schema';
import { ResponseAnalysisLog, ResponseAnalysisLogSchema } from './schemas/response-analysis-log.schema';
import { ProfileGenLog, ProfileGenLogSchema } from './schemas/profile-gen-log.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: QuestionGenLog.name, schema: QuestionGenLogSchema },
      { name: ResponseAnalysisLog.name, schema: ResponseAnalysisLogSchema },
      { name: ProfileGenLog.name, schema: ProfileGenLogSchema },
    ])
  ],
  controllers: [InterviewerController],
  providers: [InterviewerService]
})
export class InterviewerModule {}
