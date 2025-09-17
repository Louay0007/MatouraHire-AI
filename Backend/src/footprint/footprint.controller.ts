import { Controller, Post, Query } from '@nestjs/common';
import { FootprintService } from './footprint.service';

@Controller('footprint_scanner')
export class FootprintController {
  constructor(private readonly service: FootprintService) {}

  @Post('analyze_github')
  async analyzeGithub(
    @Query('username') username: string,
    @Query('target_role') target_role = 'Software Developer',
    @Query('region') region = 'Global',
  ) {
    return this.service.proxyAnalyzeGithub({ username, target_role, region });
  }

  @Post('analyze_linkedin')
  async analyzeLinkedin(
    @Query('username') username?: string,
    @Query('profile_url') profile_url?: string,
  ) {
    return this.service.proxyAnalyzeLinkedin({ username, profile_url });
  }

  @Post('analyze_stackoverflow')
  async analyzeStackOverflow(@Query('user_id') user_id: string) {
    return this.service.proxyAnalyzeStackOverflow({ user_id });
  }
}
