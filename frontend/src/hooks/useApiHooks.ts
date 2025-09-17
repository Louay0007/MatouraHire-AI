import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Resume Writer
export const useResumeWriter = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/resume_writer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
  });
};

export const useResumePdfFromText = () => {
  return useMutation({
    mutationFn: async (data: { rewritten_resume: string; templateId: string }) => {
      const response = await api.post('/resume_writer/pdf-from-text', data, {
        responseType: 'blob',
      });
      return response.data as Blob;
    },
  });
};

export const useResumePdfUpload = () => {
  return useMutation({
    mutationFn: async (data: { file: File; templateId: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('templateId', data.templateId);
      const response = await api.post('/resume_writer/pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      });
      return response.data as Blob;
    },
  });
};

// Create Report
export const useCreateReport = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const base = api.defaults.baseURL || 'http://127.0.0.1:3000';
      const url = `${base}/create_report`;
      const resp = await fetch(url, { method: 'POST', body: formData });
      const text = await resp.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
      if (!resp.ok) {
        const err: any = new Error('Create report failed');
        err.response = { status: resp.status, data };
        throw err;
      }
      return data;
    },
  });
};

// Aggregate Report
export const useAggregateReport = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const base = api.defaults.baseURL || 'http://127.0.0.1:3000';
      const url = `${base}/create_report/aggregate`;
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
      const text = await resp.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
      if (!resp.ok) {
        const err: any = new Error('Aggregate report failed');
        err.response = { status: resp.status, data };
        throw err;
      }
      return data;
    },
  });
};

// AI Interviewer - Generate Questions
export const useGenerateQuestions = () => {
  return useMutation({
    mutationFn: async (data: {
      job_description: string;
      interview_type: string;
      num_questions: number;
    }) => {
      const response = await api.post('/ai_interviewer/generate_questions', data);
      return response.data;
    },
  });
};

// AI Interviewer - Analyze Response
export const useAnalyzeResponse = () => {
  return useMutation({
    mutationFn: async (data: {
      question: string;
      response: string;
      question_type: string;
    }) => {
      const response = await api.post('/ai_interviewer/analyze_response', data);
      return response.data;
    },
  });
};

// AI Interviewer - Generate Profile
export const useGenerateProfile = () => {
  return useMutation({
    mutationFn: async (data: { responses: Array<any> }) => {
      const response = await api.post('/ai_interviewer/generate_profile', data);
      return response.data;
    },
  });
};

// Job Matcher - Analyze CV
export const useAnalyzeCv = () => {
  return useMutation({
    mutationFn: async (data: { resume_text: string }) => {
      const response = await api.post('/job_matcher/analyze_cv', data);
      return response.data;
    },
  });
};

// Job Matcher - Search Jobs
export const useSearchJobs = () => {
  return useMutation({
    mutationFn: async (params: {
      keywords: string;
      location?: string;
      max_jobs: string | number;
      region?: string;
      remote_ok?: string | boolean;
      currency?: string;
    }) => {
      // Build curl-identical URL and use fetch (bypass axios quirks)
      const base = api.defaults.baseURL || 'http://127.0.0.1:3000';
      const enc = (v: string) => encodeURIComponent(v).replace(/%20/g, '+');
      const order = ['keywords', 'location', 'max_jobs', 'remote_ok', 'region', 'currency'] as const;
      const map: Record<string, string> = {
        keywords: String(params.keywords ?? ''),
      };
      if (params.location !== undefined) map.location = String(params.location);
      if (params.max_jobs !== undefined) map.max_jobs = String(params.max_jobs);
      if (params.remote_ok !== undefined) map.remote_ok = String(params.remote_ok);
      if (params.region !== undefined) map.region = String(params.region);
      if (params.currency !== undefined) map.currency = String(params.currency);
      const parts: string[] = [];
      for (const k of order) {
        const v = map[k];
        if (v !== undefined && v !== null && v !== '') parts.push(`${enc(k)}=${enc(v)}`);
      }
      const url = `${base}/job_matcher/search_jobs?${parts.join('&')}`;
      // eslint-disable-next-line no-console
      console.debug('JOB_SEARCH_REQUEST_FETCH', url);
      const resp = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, cache: 'no-store' });
      const text = await resp.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
      if (!resp.ok) {
        const err: any = new Error(`Job search failed (${resp.status})`);
        err.response = { status: resp.status, data };
        throw err;
      }
      return data;
    },
  });
};

// Auth - Register
export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: { email: string; name: string; password: string }) => {
      const res = await api.post('/auth/register', data);
      const out = res.data;
      if (out?.access_token) {
        localStorage.setItem('auth_token', out.access_token);
        localStorage.setItem('auth_user', JSON.stringify(out.user));
      }
      return out;
    },
  });
};

// Auth - Login
export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post('/auth/login', data);
      const out = res.data;
      if (out?.access_token) {
        localStorage.setItem('auth_token', out.access_token);
        localStorage.setItem('auth_user', JSON.stringify(out.user));
      }
      return out;
    },
  });
};

// Auth - Me
export const useMe = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await api.get('/auth/me');
      const user = res.data;
      if (user) localStorage.setItem('auth_user', JSON.stringify(user));
      return user;
    },
  });
};

// Profile - Update
export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (data: { name?: string; avatarUrl?: string }) => {
      const res = await api.patch('/profile', data);
      const user = res.data;
      if (user) localStorage.setItem('auth_user', JSON.stringify(user));
      return user;
    },
  });
};

// Auth - Logout (client only)
export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return true;
    },
  });
};

// Footprint Scanner - GitHub
export const useAnalyzeGithub = () => {
  return useMutation({
    mutationFn: async (params: {
      username: string;
      target_role?: string;
      region?: string;
    }) => {
      const base = api.defaults.baseURL || 'http://127.0.0.1:3000';
      const enc = (v: string) => encodeURIComponent(v).replace(/%20/g, '+');
      const order = ['username', 'target_role', 'region'] as const;
      const map: Record<string, string> = { username: String(params.username) };
      if (params.target_role !== undefined) map.target_role = String(params.target_role);
      if (params.region !== undefined) map.region = String(params.region);
      const qs = order
        .map(k => map[k])
        .map((v, i) => (v ? `${enc(order[i])}=${enc(v)}` : ''))
        .filter(Boolean)
        .join('&');
      const url = `${base}/footprint_scanner/analyze_github?${qs}`;
      const resp = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, cache: 'no-store' });
      const text = await resp.text();
      const data = text ? JSON.parse(text) : {};
      if (!resp.ok) throw Object.assign(new Error('Github analyze failed'), { response: { status: resp.status, data } });
      return data;
    },
  });
};

// Footprint Scanner - LinkedIn
export const useAnalyzeLinkedin = () => {
  return useMutation({
    mutationFn: async (params: {
      username?: string;
      profile_url?: string;
    }) => {
      const base = api.defaults.baseURL || 'http://127.0.0.1:3000';
      const enc = (v: string) => encodeURIComponent(v).replace(/%20/g, '+');
      const order = ['username', 'profile_url'] as const;
      const map: Record<string, string> = {} as any;
      if (params.username) map.username = String(params.username);
      if (params.profile_url) map.profile_url = String(params.profile_url);
      const parts: string[] = [];
      for (const k of order) {
        const v = map[k];
        if (v) parts.push(`${enc(k)}=${enc(v)}`);
      }
      const url = `${base}/footprint_scanner/analyze_linkedin?${parts.join('&')}`;
      const resp = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, cache: 'no-store' });
      const text = await resp.text();
      const data = text ? JSON.parse(text) : {};
      if (!resp.ok) throw Object.assign(new Error('LinkedIn analyze failed'), { response: { status: resp.status, data } });
      return data;
    },
  });
};

// Footprint Scanner - StackOverflow
export const useAnalyzeStackOverflow = () => {
  return useMutation({
    mutationFn: async (params: { user_id: string }) => {
      const base = api.defaults.baseURL || 'http://127.0.0.1:3000';
      const enc = (v: string) => encodeURIComponent(v).replace(/%20/g, '+');
      const url = `${base}/footprint_scanner/analyze_stackoverflow?user_id=${enc(String(params.user_id))}`;
      const resp = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, cache: 'no-store' });
      const text = await resp.text();
      const data = text ? JSON.parse(text) : {};
      if (!resp.ok) throw Object.assign(new Error('StackOverflow analyze failed'), { response: { status: resp.status, data } });
      return data;
    },
  });
};