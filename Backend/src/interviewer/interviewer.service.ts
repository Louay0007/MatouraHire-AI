import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuestionGenLog, QuestionGenLogDocument } from './schemas/question-gen-log.schema';
import { ResponseAnalysisLog, ResponseAnalysisLogDocument } from './schemas/response-analysis-log.schema';
import { ProfileGenLog, ProfileGenLogDocument } from './schemas/profile-gen-log.schema';

const PY_BASE = process.env.PY_BACKEND_BASE_URL || 'http://127.0.0.1:8000';

@Injectable()
export class InterviewerService {
  constructor(
    private readonly http: HttpService,
    @InjectModel(QuestionGenLog.name) private qLog: Model<QuestionGenLogDocument>,
    @InjectModel(ResponseAnalysisLog.name) private rLog: Model<ResponseAnalysisLogDocument>,
    @InjectModel(ProfileGenLog.name) private pLog: Model<ProfileGenLogDocument>,
  ) {}

  async proxyGenerateQuestions(body: { job_description: string; interview_type?: string; num_questions?: number }): Promise<any> {
    const url = `${PY_BASE}/ai_interviewer/generate_questions`;
    const resp = await firstValueFrom(this.http.post(url, body));
    const data = resp.data;
    await this.qLog.create({
      job_description: body.job_description,
      interview_type: body.interview_type,
      num_questions: body.num_questions,
      total_questions: data?.total_questions,
    });
    return data;
  }

  async proxyAnalyzeResponse(body: { question: string; response: string; question_type?: string }): Promise<any> {
    const url = `${PY_BASE}/ai_interviewer/analyze_response`;
    const resp = await firstValueFrom(this.http.post(url, body));
    const data = resp.data;
    await this.rLog.create({
      question: body.question,
      response: body.response,
      question_type: body.question_type,
    });
    return data;
  }

  async proxyGenerateProfile(body: { responses: any[] }): Promise<any> {
    const url = `${PY_BASE}/ai_interviewer/generate_profile`;
    const resp = await firstValueFrom(this.http.post(url, body));
    const data = resp.data;
    await this.pLog.create({
      responses_count: Array.isArray(body.responses) ? body.responses.length : 0,
      summary: data?.profile,
    });
    return data;
  }
}
