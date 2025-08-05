import api from './config';

// Auth API
export const authApi = {
  login: (credentials: { email?: string; phone?: string; password: string }) =>
    api.post('/api/auth/login', credentials),
  
  logout: () =>
    api.post('/api/auth/logout'),
  
  refreshToken: () =>
    api.post('/api/auth/refresh'),
};

// Register API
export const registerApi = {
  step1: (data: { phone?: string; email?: string }) =>
    api.post('/api/register/step1', data),
  
  verifyOtp: (data: { sessionId: string; otp: string }) =>
    api.post('/api/register/verify-otp', data),
  
  resendOtp: (data: { sessionId: string }) =>
    api.post('/api/register/resend-otp', data),
  
  complete: (data: { 
    sessionId: string; 
    fullName: string; 
    password: string; 
    confirmPassword: string;
  }) =>
    api.post('/api/register/complete', data),
};

// User API
export const userApi = {
  getProfile: () =>
    api.get('/api/user/profile'),
  
  updateProfile: (data: Record<string, unknown>) =>
    api.put('/api/user/profile', data),
  
  changePassword: (data: { 
    currentPassword: string; 
    newPassword: string; 
    confirmPassword: string;
  }) =>
    api.put('/api/user/change-password', data),
};

// Medical Services API
export const medicalApi = {
  getFacilities: () =>
    api.get('/api/medical/facilities'),
  
  getServices: () =>
    api.get('/api/medical/services'),
  
  bookAppointment: (data: Record<string, unknown>) =>
    api.post('/api/medical/appointments', data),
  
  getAppointments: () =>
    api.get('/api/medical/appointments'),
};

// News API
export const newsApi = {
  getNews: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get('/api/news', { params }),
  
  getNewsById: (id: string) =>
    api.get(`/api/news/${id}`),
};
