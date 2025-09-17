import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { InterviewerService } from './interviewer.service';

class GenerateQuestionsDto {
  job_description!: string;
  interview_type?: string;
  num_questions?: number;
}

class AnalyzeResponseDto {
  question!: string;
  response!: string;
  question_type?: string;
}

class GenerateProfileDto {
  responses!: any[];
}

@Controller('ai_interviewer')
export class InterviewerController {
  constructor(private readonly service: InterviewerService) {}

  @Post('generate_questions')
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateQuestions(@Body() body: GenerateQuestionsDto) {
    return this.service.proxyGenerateQuestions(body);
  }

  @Post('analyze_response')
  @UsePipes(new ValidationPipe({ transform: true }))
  async analyzeResponse(@Body() body: AnalyzeResponseDto) {
    return this.service.proxyAnalyzeResponse(body);
  }

  @Post('generate_profile')
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateProfile(@Body() body: GenerateProfileDto) {
    return this.service.proxyGenerateProfile(body);
  }
}
