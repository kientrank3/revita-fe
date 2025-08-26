import { 
  MedicalRecord, 
  Template, 
  CreateMedicalRecordDto, 
  UpdateMedicalRecordDto 
} from '@/lib/types/medical-record';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class MedicalRecordService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/medical-records${endpoint}`;
    
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

  // Get all medical records
  async getAll(): Promise<MedicalRecord[]> {
    return this.request<MedicalRecord[]>('');
  }

  // Get medical records by patient profile
  async getByPatientProfile(patientProfileId: string): Promise<MedicalRecord[]> {
    return this.request<MedicalRecord[]>(`/patient-profile/${patientProfileId}`);
  }

//   // Get medical records by doctor
//   async getByDoctor(doctorId: string): Promise<MedicalRecord[]> {
//     return this.request<MedicalRecord[]>(`/doctor/${doctorId}/medical-records`);
//   }

  // Get single medical record
  async getById(id: string): Promise<MedicalRecord> {
    return this.request<MedicalRecord>(`/${id}`);
  }

  // Create new medical record
  async create(data: CreateMedicalRecordDto): Promise<MedicalRecord> {
    return this.request<MedicalRecord>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update medical record
  async update(id: string, data: UpdateMedicalRecordDto): Promise<MedicalRecord> {
    return this.request<MedicalRecord>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete medical record
  async delete(id: string): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Get all templates
  async getTemplates(): Promise<Template[]> {
    return this.request<Template[]>('/templates');
  }

  // Get template by ID
  async getTemplateById(templateId: string): Promise<Template> {
    return this.request<Template>(`/templates/${templateId}`);
  }

  // Get template by medical record
  async getTemplateByMedicalRecord(id: string): Promise<Template> {
    return this.request<Template>(`/${id}/template`);
  }
}

export const medicalRecordService = new MedicalRecordService();
