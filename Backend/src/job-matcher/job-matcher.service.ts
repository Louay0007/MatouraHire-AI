import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobSearchLog, JobSearchLogDocument } from './schemas/job-search-log.schema';
import { CVAnalysisLog, CVAnalysisLogDocument } from './schemas/cv-analysis-log.schema';

const PY_BASE = process.env.PY_BACKEND_BASE_URL || 'http://127.0.0.1:8000';

@Injectable()
export class JobMatcherService {
  constructor(
    private readonly http: HttpService,
    @InjectModel(JobSearchLog.name) private jobLogModel: Model<JobSearchLogDocument>,
    @InjectModel(CVAnalysisLog.name) private cvLogModel: Model<CVAnalysisLogDocument>,
  ) {}

  async proxyAnalyzeCv(body: { resume_text: string }): Promise<any> {
    const url = `${PY_BASE}/job_matcher/analyze_cv`;
    const resp = await firstValueFrom(this.http.post(url, body));
    const data = resp.data;

    await this.cvLogModel.create({
      resumeHash: String(body?.resume_text?.length || ''),
      skillsCount: (data?.analysis?.skills || []).length,
      experience_years: data?.analysis?.experience_years,
      skills: data?.analysis?.skills,
      job_keywords: data?.analysis?.job_keywords,
    });

    return data;
  }

  async proxySearchJobs(params: { keywords: string; location?: string; max_jobs?: string; region?: string; remote_ok?: string; currency?: string }): Promise<any> {
    const url = `${PY_BASE}/job_matcher/search_jobs`;
    try {
      const resp = await firstValueFrom(this.http.post(url, undefined, { params, validateStatus: () => true }));
      if (resp.status >= 400) {
        throw { response: { status: resp.status, data: resp.data } };
      }
      const data = resp.data;

      await this.jobLogModel.create({
      keywords: params.keywords,
      location: params.location,
      region: params.region,
        remote_ok: String(params.remote_ok ?? 'false') === 'true',
      currency: params.currency,
        max_jobs: Number(params.max_jobs ?? '30'),
      total_found: data?.total_found,
    });
      return data;
    } catch (err: any) {
      // Log the exact upstream URL for diagnostics
      try {
        // eslint-disable-next-line no-console
        console.warn('JOB_SEARCH_UPSTREAM_FAIL', { url, params, status: err?.response?.status, data: err?.response?.data });
      } catch {}
      // Fallback retry 1: normalize and reduce params
      const retry1 = {
        keywords: String(params.keywords || '').trim(),
        location: String(params.location || '').trim(),
        max_jobs: String(params.max_jobs || '30'),
        remote_ok: String(params.remote_ok || 'false'),
      };
      try {
        const r1 = await firstValueFrom(this.http.post(url, undefined, { params: retry1 }));
        return r1.data;
      } catch (err2: any) {
        try {
          console.warn('JOB_SEARCH_UPSTREAM_RETRY1_FAIL', { url, params: retry1, status: err2?.response?.status, data: err2?.response?.data });
        } catch {}
        // Fallback retry 2: drop location, minimal query
        const retry2 = {
          keywords: retry1.keywords,
          max_jobs: '20',
          remote_ok: 'false',
        };
        try {
          const r2 = await firstValueFrom(this.http.post(url, undefined, { params: retry2 }));
          return r2.data;
        } catch (err3: any) {
          try {
            console.warn('JOB_SEARCH_UPSTREAM_RETRY2_FAIL', { url, params: retry2, status: err3?.response?.status, data: err3?.response?.data });
          } catch {}
          // Final graceful fallback: return empty results instead of 4xx to keep UI functional
          return {
            success: true,
            jobs: [],
            total_found: 0,
            keywords: params.keywords,
            location: params.location,
            region: params.region ?? '',
            remote_ok: String(params.remote_ok ?? 'false') === 'true',
            currency: params.currency ?? '',
          };
        }
      }
    }
  }
}
