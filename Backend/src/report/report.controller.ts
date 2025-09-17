import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ReportService } from './report.service';

@Controller()
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Post('create_report')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async createReport(@UploadedFile() file: Express.Multer.File) {
    return this.service.proxyCreateReport(file);
  }

  @Post('create_report/aggregate')
  async aggregate(@Body() payload: any) {
    return this.service.proxyAggregate(payload);
  }
}


