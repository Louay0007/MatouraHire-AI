import { Body, Controller, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { JobMatcherService } from './job-matcher.service';
import { AnalyzeCvDto } from './dto/analyze-cv.dto';
import { SearchJobsDto } from './dto/search-jobs.dto';

@Controller('job_matcher')
export class JobMatcherController {
  constructor(private readonly service: JobMatcherService) {}

  @Post('analyze_cv')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false }))
  async analyzeCv(@Body() body: AnalyzeCvDto) {
    return this.service.proxyAnalyzeCv(body);
  }

  @Post('search_jobs')
  async searchJobs(@Query() query: any) {
    const params = {
      keywords: String(query.keywords || ''),
      location: query.location ? String(query.location) : undefined,
      region: query.region ? String(query.region) : undefined,
      remote_ok: query.remote_ok ?? undefined,
      max_jobs: query.max_jobs ?? undefined,
      currency: undefined,
    } as any;
    return this.service.proxySearchJobs(params);
  }
}
