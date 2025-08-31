import { UserSearchResponse } from '@/lib/types/user';
import api from '../config';

export interface PatientProfileData {
  id: string;
  profileCode: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  occupation: string;
  healthInsurance: string;
  relationship: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  isActive: boolean;
  patient: {
    id: string;
    patientCode: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
  };
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

class PatientProfileService {
  // Get patient profile by ID using search (fallback when direct endpoint isn't available)
  async getById(id: string): Promise<PatientProfileData | null> {
    try {
      // Try to search with the ID as query
      const response = await api.get(`/users/search?query=${encodeURIComponent(id)}`);
      const data: UserSearchResponse = response.data;
      
      // Look for any user that has this patient profile ID
      for (const user of data.users) {
        if (user.patient?.patientProfiles) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profile = user.patient.patientProfiles.find((p: any) => p.id === id);
          if (profile) {
            return {
              id: profile.id,
              profileCode: profile.profileCode,
              name: profile.name,
              dateOfBirth: profile.dateOfBirth,
              gender: profile.gender,
              address: profile.address,
              occupation: profile.occupation,
              healthInsurance: profile.healthInsurance,
              relationship: profile.relationship,
              emergencyContact: profile.emergencyContact,
              isActive: profile.isActive,
              patient: {
                id: user.patient.id,
                patientCode: user.patient.patientCode,
                user: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone
                }
              }
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting patient profile by ID:', error);
      return null;
    }
  }

  // Get multiple patient profiles by IDs
  async getByIds(ids: string[]): Promise<Record<string, PatientProfileData>> {
    if (ids.length === 0) return {};
    
    const profilesMap: Record<string, PatientProfileData> = {};
    
    // For now, let's try to get all patient profiles in one search
    try {
      const response = await api.get('/users/search?query=patient');
      const data: UserSearchResponse = response.data;
      
      // Process all users and their patient profiles
      for (const user of data.users) {
        if (user.patient?.patientProfiles) {
          for (const profile of user.patient.patientProfiles) {
            if (ids.includes(profile.id)) {
              profilesMap[profile.id] = {
                id: profile.id,
                profileCode: profile.profileCode,
                name: profile.name,
                dateOfBirth: profile.dateOfBirth,
                gender: profile.gender,
                address: profile.address,
                occupation: profile.occupation,
                healthInsurance: profile.healthInsurance,
                relationship: profile.relationship,
                emergencyContact: profile.emergencyContact,
                isActive: profile.isActive,
                patient: {
                  id: user.patient.id,
                  patientCode: user.patient.patientCode,
                  user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                  }
                }
              };
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting patient profiles by IDs:', error);
    }
    
    return profilesMap;
  }

  // Get all patient profiles for a patient by patientId
  async getByPatientId(patientId: string): Promise<PatientProfileData[]> {
    const response = await api.get(`/patient-profiles/patient/${encodeURIComponent(patientId)}`);
    return response.data;
  }

  async getByProfileId(patientId: string): Promise<PatientProfileData> {
    const response = await api.get(`/patient-profiles/${encodeURIComponent(patientId)}`);
    return response.data;
  }

  // Create patient profile
  async create(data: CreatePatientProfileDto): Promise<PatientProfileData> {
    const response = await api.post('/patient-profiles', data);
    return response.data;
  }

  // Update patient profile
  async update(id: string, data: Partial<CreatePatientProfileDto>): Promise<PatientProfileData> {
    const response = await api.patch(`/patient-profiles/${encodeURIComponent(id)}`, data);
    return response.data;
  }

  // Delete patient profile
  async delete(id: string): Promise<void> {
    await api.delete(`/patient-profiles/${encodeURIComponent(id)}`);
  }
}

export const patientProfileService = new PatientProfileService();
