import api from './config';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from '@/lib/types/medical-record';

// Pagination types
export type PageParams = { page?: number; limit?: number };
export type PagedResponse<T> = { data: T[]; meta: { total: number; page: number; limit: number } };

// Patient Profile Types
export interface PatientProfile {
  id: string;
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  occupation: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  healthInsurance: string;
  relationship: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientProfileDto {
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  occupation: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  healthInsurance: string;
  relationship: string;
}

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
  
  // Update current user profile
  updateMe: (data: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    citizenId?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    password?: string;
    // role-specific fields
    degrees?: string[];
    yearsExperience?: number;
    workHistory?: string;
    description?: string;
    loyaltyPoints?: number;
    adminCode?: string;
  }) =>
    api.put('/users/me', data),
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

// Medical Records API (paginated)
export const medicalRecordApi = {
  // Get all medical records (role-based filtering, paginated)
  getAll: (params?: PageParams) =>
    api.get('/medical-records', { params }),
  
  // Get medical records by patient profile (paginated)
  getByPatientProfile: (patientProfileId: string, params?: PageParams) =>
    api.get(`/medical-records/patient-profile/${patientProfileId}`, { params }),
  
  // Get medical records by doctor
  getByDoctor: (doctorId: string) =>
    api.get(`/medical-records/doctor/${doctorId}`),
  
  // Get single medical record
  getById: (id: string) =>
    api.get(`/medical-records/${id}`),
  
  // Create medical record
  create: (data: CreateMedicalRecordDto) =>
    api.post('/medical-records', data),
  
  // Update medical record
  update: (id: string, data: UpdateMedicalRecordDto) =>
    api.patch(`/medical-records/${id}`, data),
  
  // Delete medical record
  delete: (id: string) =>
    api.delete(`/medical-records/${id}`),
  
  // Get templates
  getTemplates: () =>
    api.get('/medical-records/templates'),
  
  // Get template by ID
  getTemplateById: (templateId: string) =>
    api.get(`/medical-records/templates/${templateId}`),
};

// Admin API (paginated)
export const adminApi = {
  // Get all users with optional role filter
  getAllUsers: (params?: { role?: string } & PageParams) =>
    api.get('/admin/users', { params }),
  
  // Get user by ID
  getUserById: (userId: string) =>
    api.get(`/admin/users/${userId}`),
  
  // Create new user
  createUser: (data: {
    name: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    citizenId: string;
    avatar?: string;
    password: string;
    email?: string;
    phone?: string;
    role: string;
    loyaltyPoints?: number;
    degrees?: string[];
    yearsExperience?: number;
    workHistory?: string;
    description?: string;
    adminCode?: string;
  }) =>
    api.post('/admin/users', data),
  
  // Update user
  updateUser: (userId: string, data: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    citizenId?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    password?: string;
    degrees?: string[];
    yearsExperience?: number;
    workHistory?: string;
    description?: string;
    loyaltyPoints?: number;
    adminCode?: string;
  }) =>
    api.put(`/admin/users/${userId}`, data),
  
  // Delete user
  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`),

  // specialties, templates, services, counters (paginated)
  getSpecialties: (params?: PageParams) => api.get('/admin/specialties', { params }),
  getTemplates: (params?: { specialtyId?: string } & PageParams) => api.get('/admin/templates', { params }),
  getServices: (params?: PageParams) => api.get('/admin/services', { params }),
  getCounters: (params?: { isActive?: boolean } & PageParams) => api.get('/admin/counters', { params }),
};

// Receptionist API (paginated)
export const receptionistApi = {
  // Register new patient
  registerPatient: (data: {
    name: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    citizenId: string;
    avatar?: string;
    phone: string;
    email?: string;
    password: string;
  }) =>
    api.post('/receptionists/patients', data),
  
  // Update patient
  updatePatient: (patientId: string, data: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    citizenId?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    loyaltyPoints?: number;
    password?: string;
  }) =>
    api.put(`/receptionists/patients/${patientId}`, data),

  // List users (by role) for receptionist
  getUsers: (params?: { role?: string } & PageParams) =>
    api.get('/receptionists/users', { params }),

  // List patients for receptionist
  getPatients: (params?: PageParams) =>
    api.get('/receptionists/patients', { params }),

  // List appointments for receptionist
  getAppointments: (params?: PageParams) =>
    api.get('/receptionists/appointments', { params }),
};

// News API
export const newsApi = {
  getNews: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get('/news', { params }),
  
  getNewsById: (id: string) =>
    api.get(`/news/${id}`),
};

// Cashier/Invoice Payments API
export const cashierApi = {
  // Lookup prescription by code (for cashier scanning)
  getPrescriptionByCode: (prescriptionCode: string) =>
    api.get(`/prescriptions/${encodeURIComponent(prescriptionCode)}`),

  // Preview invoice for selected services on a prescription
  previewInvoice: (data: {
    prescriptionCode: string;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'WALLET';
    selectedServiceCodes: string[];
  }) => api.post('/invoice-payments/preview', data),

  // Create invoice draft (not yet paid)
  createInvoiceDraft: (data: {
    prescriptionCode: string;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'WALLET';
    cashierId: string;
    selectedServiceCodes: string[];
  }) => api.post('/invoice-payments/create', data),

  // Confirm payment for an invoice
  confirmPayment: (data: { invoiceCode: string; cashierId: string }) =>
    api.post('/invoice-payments/confirm', data),
};

// Patient Profile API
export const patientProfileApi = {
  // Lấy patient profile theo patient ID
  getByPatientId: (patientId: string) =>
    api.get(`/patient-profiles/patient/${patientId}`),
  
  // Lấy patient profile theo ID
  getById: (patientProfileId: string) =>
    api.get(`/patient-profiles/${patientProfileId}`),
  
  // Tạo patient profile mới
  create: (data: {
    patientId: string;
    name: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    occupation: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    healthInsurance: string;
    relationship: string;
  }) =>
    api.post('/patient-profiles', data),
  
  // Cập nhật patient profile
  update: (patientProfileId: string, data: Partial<CreatePatientProfileDto>) =>
    api.put(`/patient-profiles/${patientProfileId}`, data),
  
  // Xóa patient profile
  delete: (patientProfileId: string) =>
    api.delete(`/patient-profiles/${patientProfileId}`),
};
