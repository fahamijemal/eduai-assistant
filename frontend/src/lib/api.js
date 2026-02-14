import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eduai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('eduai_token');
      localStorage.removeItem('eduai_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// ── Documents ────────────────────────────────────────
export const documentsApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': undefined },
    });
  },
  list: () => api.get('/documents'),
  get: (id) => api.get(`/documents/${id}`),
  getText: (id) => api.get(`/documents/${id}/text`),
  delete: (id) => api.delete(`/documents/${id}`),
};

// ── AI ───────────────────────────────────────────────
export const aiApi = {
  ask: (data) => api.post('/ai/ask', data),
  summarize: (data) => api.post('/ai/summarize', data),
  compareDocuments: (data) => api.post('/ai/compare-documents', data),
  extractTopics: (data) => api.post('/ai/extract-topics', data),
  generateQuiz: (data) => api.post('/ai/generate-quiz', data),
  submitQuiz: (data) => api.post('/ai/submit-quiz', data),
};

// ── Analytics ────────────────────────────────────────
export const analyticsApi = {
  getMastery: () => api.get('/analytics/mastery'),
  getWeakTopics: () => api.get('/analytics/weak-topics'),
  getExamReadiness: () => api.get('/analytics/exam-readiness'),
  getStudyTime: () => api.get('/analytics/study-time'),
  getPerformanceTrend: () => api.get('/analytics/performance-trend'),
  getRevisionPlan: () => api.get('/analytics/revision-plan'),
  startStudySession: () => api.post('/analytics/study-session/start'),
  endStudySession: (sessionId) => api.post('/analytics/study-session/end', { sessionId }),
};

export default api;
