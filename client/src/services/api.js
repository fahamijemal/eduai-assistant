import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ===== Auth API =====
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ===== Documents API =====
export const documentsAPI = {
  upload: (formData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: () => api.get('/documents'),
  delete: (id) => api.delete(`/documents/${id}`),
};

// ===== AI API =====
export const aiAPI = {
  ask: (documentId, question) => api.post('/ai/ask', { documentId, question }),
  summarize: (documentId) => api.post('/ai/summarize', { documentId }),
  generateQuiz: (documentId) => api.post('/ai/generate-quiz', { documentId }),
};

// ===== History API =====
export const historyAPI = {
  getAll: (type) => api.get('/history', { params: type ? { type } : {} }),
  getOne: (id) => api.get(`/history/${id}`),
  getStats: () => api.get('/history/stats/overview'),
};

export default api;
