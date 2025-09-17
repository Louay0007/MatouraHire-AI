import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import { AxiosResponse } from 'axios';
import { Readable } from 'stream';

const PY_BASE = process.env.PY_BACKEND_BASE_URL || 'http://127.0.0.1:8000';

type UploadedFile = { buffer: Buffer; originalname: string; mimetype: string };

@Injectable()
export class ResumeService {
  constructor(private readonly http: HttpService) {}

  async proxyRewrite(file: UploadedFile): Promise<any> {
    try {
      if (!file || !file.buffer) {
        throw new HttpException('No file uploaded or empty buffer', HttpStatus.BAD_REQUEST);
      }

      const form = new FormData();
      form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
      const headers = form.getHeaders();
      const url = `${PY_BASE}/resume_writer`;
      const resp = await firstValueFrom(this.http.post(url, form, { headers }));
      return resp.data;
    } catch (err: any) {
      const status = err?.response?.status ?? HttpStatus.BAD_GATEWAY;
      const data = err?.response?.data ?? err?.message ?? 'Upstream error';
      throw new HttpException({ message: 'Resume rewrite failed', upstream: data }, status);
    }
  }

  async proxyRewritePdf(file: UploadedFile, templateId: string): Promise<Readable> {
    try {
      if (!file || !file.buffer) {
        throw new HttpException('No file uploaded or empty buffer', HttpStatus.BAD_REQUEST);
      }
      const form = new FormData();
      form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
      form.append('templateId', templateId || 'ats');
      const headers = form.getHeaders();
      const url = `${PY_BASE}/resume_writer/pdf`;
      const resp: AxiosResponse<any> = await firstValueFrom(this.http.post(url, form, { headers, responseType: 'stream' }));
      return resp.data as Readable;
    } catch (err: any) {
      const status = err?.response?.status ?? HttpStatus.BAD_GATEWAY;
      const data = err?.response?.data ?? err?.message ?? 'Upstream error';
      throw new HttpException({ message: 'Resume PDF generation failed', upstream: data }, status);
    }
  }

  async proxyRewritePdfFromText(rewritten: string, templateId: string): Promise<Readable> {
    try {
      const url = `${PY_BASE}/resume_writer/pdf-from-text`;
      const body = { rewritten_resume: rewritten, templateId: templateId || 'ats' };
      const resp: AxiosResponse<any> = await firstValueFrom(this.http.post(url, body, { responseType: 'stream' }));
      return resp.data as Readable;
    } catch (err: any) {
      const status = err?.response?.status ?? HttpStatus.BAD_GATEWAY;
      const data = err?.response?.data ?? err?.message ?? 'Upstream error';
      throw new HttpException({ message: 'Resume PDF generation from text failed', upstream: data }, status);
    }
  }
}
