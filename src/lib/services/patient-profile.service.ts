import { UserSearchResponse } from '@/lib/types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get patient profile by ID using search (fallback when direct endpoint isn't available)
  async getById(id: string): Promise<PatientProfileData | null> {
    try {
      // Try to search with the ID as query
      const response = await this.request<UserSearchResponse>(`/users/search?query=${encodeURIComponent(id)}`);
      
      // Look for any user that has this patient profile ID
      for (const user of response.users) {
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
      const response = await this.request<UserSearchResponse>('/users/search?query=patient');
      
      // Process all users and their patient profiles
      for (const user of response.users) {
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
    return this.request<PatientProfileData[]>(`/patient-profiles/patient/${encodeURIComponent(patientId)}`);
  }

  // Create patient profile
  async create(data: CreatePatientProfileDto): Promise<PatientProfileData> {
    return this.request<PatientProfileData>(`/patient-profiles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update patient profile
  async update(id: string, data: Partial<CreatePatientProfileDto>): Promise<PatientProfileData> {
    return this.request<PatientProfileData>(`/patient-profiles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete patient profile
  async delete(id: string): Promise<void> {
    await this.request<void>(`/patient-profiles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}

export const patientProfileService = new PatientProfileService();
