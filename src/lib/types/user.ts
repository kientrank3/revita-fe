export interface PatientProfile {
  id: string;
  profileCode: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  occupation: string;
  healthInsurance: string;
  relationship: string;
  isActive: boolean;
}

export interface Patient {
  id: string;
  patientCode: string;
  loyaltyPoints: number;
  patientProfiles: PatientProfile[];
}

export interface Doctor {
  id: string;
  doctorCode: string;
  specialty: string;
  licenseNumber: string;
  experience: number;
}

export interface Receptionist {
  id: string;
  receptionistCode: string;
  department: string;
}

export interface Admin {
  id: string;
  adminCode: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  citizenId: string;
  patient: Patient | null;
  doctor: Doctor | null;
  receptionist: Receptionist | null;
  admin: Admin | null;
}

export interface UserSearchResponse {
  query: string;
  total: number;
  users: User[];
}
