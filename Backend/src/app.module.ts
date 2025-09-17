import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResumeModule } from './resume/resume.module';
import { InterviewerModule } from './interviewer/interviewer.module';
import { JobMatcherModule } from './job-matcher/job-matcher.module';
import { FootprintModule } from './footprint/footprint.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { ReportModule } from './report/report.module';

const MONGO_URI = 'mongodb+srv://admin:admin001@chabaqa.ujqhyya.mongodb.net/?retryWrites=true&w=majority&appName=chabaqa';

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_URI),
    ResumeModule,
    InterviewerModule,
    JobMatcherModule,
    FootprintModule,
    AuthModule,
    ProfileModule,
    ReportModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
