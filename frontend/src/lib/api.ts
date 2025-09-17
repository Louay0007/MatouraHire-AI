import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    serialize: (params: Record<string, any>) => {
      const p = params || {};
      const order = ['keywords', 'location', 'max_jobs', 'remote_ok', 'region', 'currency'];
      const seen: Record<string, boolean> = {};
      const encode = (v: string) => encodeURIComponent(v).replace(/%20/g, '+');
      const parts: string[] = [];
      for (const key of order) {
        const val = p[key];
        if (val !== undefined && val !== null && val !== '') {
          parts.push(`${encode(key)}=${encode(String(val))}`);
          seen[key] = true;
        }
      }
      for (const k of Object.keys(p)) {
        if (seen[k]) continue;
        const val = p[k];
        if (val !== undefined && val !== null && val !== '') {
          parts.push(`${encode(k)}=${encode(String(val))}`);
        }
      }
      return parts.join('&');
    },
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/auth/login';
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Mock mode removed