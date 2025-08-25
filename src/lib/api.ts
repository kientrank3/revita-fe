import api from './config';

// Auth API
export const authApi = {
  // Đăng nhập truyền thống (Email/SĐT & Mật khẩu)
  login: (credentials: { identifier: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  // Đăng nhập Google (Google OAuth2)
  googleLogin: (data: { code: string }) =>
    api.post('/auth/google/token', data),
  
  // Làm mới token (Refresh Token)
  refreshToken: (data: { refreshToken: string }) =>
    api.post('/auth/refresh', data),
  
  // Lấy thông tin người dùng (Me)
  getMe: () =>
    api.get('/auth/me'),
  
  logout: () =>
    api.post('/auth/logout'),
};

// Register API
export const registerApi = {
  step1: (data: { phone?: string; email?: string }) =>
    api.post('/register/step1', data),
  
  verifyOtp: (data: { sessionId: string; otp: string }) =>
    api.post('/register/verify-otp', data),
  
  resendOtp: (data: { sessionId: string }) =>
    api.post('/register/resend-otp', data),
  
  complete: (data: { 
    sessionId: string; 
    fullName: string; 
    password: string; 
    confirmPassword: string;
  }) =>
    api.post('/register/complete', data),
};

// User API
export const userApi = {
  getProfile: () =>
    api.get('/user/profile'),
  
  updateProfile: (data: Record<string, unknown>) =>
    api.put('/user/profile', data),
  
  changePassword: (data: { 
    currentPassword: string; 
    newPassword: string; 
    confirmPassword: string;
  }) =>
    api.put('/user/change-password', data),
};

// Medical Services API
export const medicalApi = {
  getFacilities: () =>
    api.get('/medical/facilities'),
  
  getServices: () =>
    api.get('/medical/services'),
  
  bookAppointment: (data: Record<string, unknown>) =>
    api.post('/medical/appointments', data),
  
  getAppointments: () =>
    api.get('/medical/appointments'),
};

// News API
export const newsApi = {
  getNews: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get('/news', { params }),
  
  getNewsById: (id: string) =>
    api.get(`/news/${id}`),
};
