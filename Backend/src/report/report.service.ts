import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
const FormData = require('form-data');

const PY_BASE = process.env.PY_BACKEND_BASE_URL || 'http://127.0.0.1:8000';

@Injectable()
export class ReportService {
  constructor(private readonly http: HttpService) {}

  async proxyCreateReport(file: Express.Multer.File) {
    try {
      const form = new FormData();
      form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
      const headers = (form as any).getHeaders ? (form as any).getHeaders() : {};
      const resp = await firstValueFrom(this.http.post(`${PY_BASE}/create_report`, form as any, { headers }));
      return resp.data;
    } catch (err: any) {
      const status = err?.response?.status ?? 502;
      const data = err?.response?.data ?? { message: err?.message || 'Upstream error' };
      throw new HttpException(data, status);
    }
  }

  async proxyAggregate(payload: any) {
    try {
      const resp = await firstValueFrom(this.http.post(`${PY_BASE}/create_report/aggregate`, payload));
      return resp.data;
    } catch (err: any) {
      const status = err?.response?.status ?? 502;
      const data = err?.response?.data ?? { message: err?.message || 'Upstream error' };
      throw new HttpException(data, status);
    }
  }
}


