import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FootprintLog, FootprintLogDocument } from './schemas/footprint-log.schema';

const PY_BASE = process.env.PY_BACKEND_BASE_URL || 'http://127.0.0.1:8000';

// Simple in-memory cache
const cache = new Map<string, { data: any; expiresAt: number }>();
const ttlMs = 5 * 60 * 1000;

function cacheKey(service: string, params: Record<string, any>): string {
  return `${service}:${Object.entries(params).sort((a,b) => a[0].localeCompare(b[0])).map(([k,v]) => `${k}=${v ?? ''}`).join('&')}`;
}

@Injectable()
export class FootprintService {
  constructor(
    private readonly http: HttpService,
    @InjectModel(FootprintLog.name) private logModel: Model<FootprintLogDocument>,
  ) {}

  private async proxyGet(path: string, params: any): Promise<any> {
    const key = cacheKey(path, params);
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && hit.expiresAt > now) {
      return hit.data;
    }
    const url = `${PY_BASE}${path}`;
    const resp = await firstValueFrom(this.http.post(url, null, { params }));
    const data = resp.data;
    cache.set(key, { data, expiresAt: now + ttlMs });
    return data;
  }

  async proxyAnalyzeGithub(params: { username: string; target_role: string; region: string }): Promise<any> {
    const data = await this.proxyGet('/footprint_scanner/analyze_github', params);
    await this.logModel.create({ provider: 'github', identifier: params.username, responseSize: JSON.stringify(data).length });
    return data;
  }

  async proxyAnalyzeLinkedin(params: { username?: string; profile_url?: string }): Promise<any> {
    const data = await this.proxyGet('/footprint_scanner/analyze_linkedin', params);
    const id = params.username || params.profile_url || '';
    await this.logModel.create({ provider: 'linkedin', identifier: id, responseSize: JSON.stringify(data).length });
    return data;
  }

  async proxyAnalyzeStackOverflow(params: { user_id: string }): Promise<any> {
    const data = await this.proxyGet('/footprint_scanner/analyze_stackoverflow', params);
    await this.logModel.create({ provider: 'stackoverflow', identifier: params.user_id, responseSize: JSON.stringify(data).length });
    return data;
  }
}
