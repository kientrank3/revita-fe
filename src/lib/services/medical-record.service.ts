import { 
  MedicalRecord, 
  Template, 
  CreateMedicalRecordDto, 
  UpdateMedicalRecordDto 
} from '@/lib/types/medical-record';
import api from '../config';

class MedicalRecordService {
  // Get all medical records
  async getAll(): Promise<MedicalRecord[]> {
    const response = await api.get('/medical-records');
    const data = response.data as unknown;
    if (Array.isArray(data)) return data as MedicalRecord[];
    if (data && typeof data === 'object') {
      // Support common API shapes like { items: [...]} or { data: [...] }
      const maybeArray = (data as Record<string, unknown>).items ?? (data as Record<string, unknown>).data;
      if (Array.isArray(maybeArray)) return maybeArray as MedicalRecord[];
    }
    return [];
  }

  // Get medical records by patient profile
  async getByPatientProfile(patientProfileId: string): Promise<MedicalRecord[]> {
    const response = await api.get(`/medical-records/patient-profile/${patientProfileId}`);
    const data = response.data as unknown;
    if (Array.isArray(data)) return data as MedicalRecord[];
    if (data && typeof data === 'object') {
      const maybeArray = (data as Record<string, unknown>).items ?? (data as Record<string, unknown>).data;
      if (Array.isArray(maybeArray)) return maybeArray as MedicalRecord[];
    }
    return [];
  }

//   // Get medical records by doctor
//   async getByDoctor(doctorId: string): Promise<MedicalRecord[]> {
//     const response = await api.get(`/medical-records/doctor/${doctorId}/medical-records`);
//     return response.data;
//   }

  // Get single medical record
  async getById(id: string): Promise<MedicalRecord> {
    const response = await api.get(`/medical-records/${id}`);
    return response.data;
  }

  // Create new medical record
  async create(data: CreateMedicalRecordDto): Promise<MedicalRecord> {
    console.log('data', data);
    const response = await api.post('/medical-records', data);
    return response.data;
  }

  // Update medical record
  async update(id: string, data: UpdateMedicalRecordDto): Promise<MedicalRecord> {
    const response = await api.patch(`/medical-records/${id}`, data);
    return response.data;
  }

  // Delete medical record
  async delete(id: string): Promise<void> {
    await api.delete(`/medical-records/${id}`);
  }

  // Get all templates
  async getTemplates(): Promise<Template[]> {
    const response = await api.get('/medical-records/templates');
    return response.data;
  }

  // Get template by ID
  async getTemplateById(templateId: string): Promise<Template> {
    const response = await api.get(`/medical-records/templates/${templateId}`);
    return response.data;
  }

  // Get template by medical record
  async getTemplateByMedicalRecord(id: string): Promise<Template> {
    const response = await api.get(`/medical-records/${id}/template`);
    return response.data;
  }
}

export const medicalRecordService = new MedicalRecordService();
