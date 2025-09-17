import { Controller, Post, UploadedFile, UseInterceptors, Body, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ResumeService } from './resume.service';
import type { Response } from 'express';

@Controller()
export class ResumeController {
  constructor(private readonly service: ResumeService) {}

  @Post('resume_writer')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async rewrite(@UploadedFile() file: any) {
    return this.service.proxyRewrite(file);
  }

  @Post('resume_writer/pdf')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async rewritePdf(@UploadedFile() file: any, @Body('templateId') templateId: string, @Res() res: Response) {
    const stream = await this.service.proxyRewritePdf(file, templateId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=enhanced_resume.pdf');
    stream.pipe(res);
  }

  @Post('resume_writer/pdf-from-text')
  async rewritePdfFromText(@Body() body: { rewritten_resume: string; templateId?: string }, @Res() res: Response) {
    const stream = await this.service.proxyRewritePdfFromText(body.rewritten_resume, body.templateId || 'ats');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=enhanced_resume.pdf');
    stream.pipe(res);
  }
}
