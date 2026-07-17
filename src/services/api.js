import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Add auth token and language header to requests
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('tickeger_user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  
  const language = localStorage.getItem('i18nextLng') || 'es';
  config.headers['Accept-Language'] = language;
  
  return config;
});

// Handle 401 responses
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tickeger_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

// Ticket services
export const ticketService = {
  getAll: (params) => API.get('/tickets', { params }),
  getById: (id) => API.get(`/tickets/${id}`),
  create: (data) => API.post('/tickets', data),
  update: (id, data) => API.put(`/tickets/${id}`, data),
  assign: (id, data) => API.put(`/tickets/${id}/assign`, data),
  changeStatus: (id, data) => API.put(`/tickets/${id}/status`, data),
  addComment: (id, data) => API.post(`/tickets/${id}/comments`, data),
  getStats: () => API.get('/tickets/stats'),
  delete: (id) => API.delete(`/tickets/${id}`),
  linkRelated: (id, relatedId) => API.post(`/tickets/${id}/related/${relatedId}`),
  unlinkRelated: (id, relatedId) => API.delete(`/tickets/${id}/related/${relatedId}`),
};

// User services
export const userService = {
  getAll: () => API.get('/users'),
  getById: (id) => API.get(`/users/${id}`),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
  updateProfile: (data) => API.put('/users/profile', data),
  updatePassword: (data) => API.put('/users/profile/password', data),
};

// Notification services
export const notificationService = {
  getAll: () => API.get('/notifications'),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
};

// Template services
export const templateService = {
  getAll: () => API.get('/templates'),
  create: (data) => API.post('/templates', data),
  update: (id, data) => API.put(`/templates/${id}`, data),
  delete: (id) => API.delete(`/templates/${id}`),
};

export default API;
