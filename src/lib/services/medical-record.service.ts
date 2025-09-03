import { 
  MedicalRecord, 
  Template, 
  CreateMedicalRecordDto, 
  UpdateMedicalRecordDto 
} from '@/lib/types/medical-record';
import api from '../config';

// Some endpoints return an array directly, others wrap in { data, meta }
function unwrapArrayResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  return [] as T[];
}

function unwrapObjectResponse<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && (payload as { data?: T }).data !== undefined) {
    return (payload as { data: T }).data as T;
  }
  return payload as T;
}

class MedicalRecordService {
  // Get all medical records
  async getAll(): Promise<MedicalRecord[]> {
    const response = await api.get('/medical-records');
    return unwrapArrayResponse<MedicalRecord>(response.data);
  }

  // Get medical records by patient profile
  async getByPatientProfile(patientProfileId: string): Promise<MedicalRecord[]> {
    const response = await api.get(`/medical-records/patient-profile/${patientProfileId}`);
    return unwrapArrayResponse<MedicalRecord>(response.data);
  }

//   // Get medical records by doctor
//   async getByDoctor(doctorId: string): Promise<MedicalRecord[]> {
//     const response = await api.get(`/medical-records/doctor/${doctorId}/medical-records`);
//     return response.data;
//   }

  // Get single medical record
  async getById(id: string): Promise<MedicalRecord> {
    const response = await api.get(`/medical-records/${id}`);
    return unwrapObjectResponse<MedicalRecord>(response.data);
  }

  // Create new medical record
  async create(data: CreateMedicalRecordDto): Promise<MedicalRecord> {
    console.log('data', data);
    const response = await api.post('/medical-records', data);
    return unwrapObjectResponse<MedicalRecord>(response.data);
  }

  // Update medical record
  async update(id: string, data: UpdateMedicalRecordDto): Promise<MedicalRecord> {
    const response = await api.patch(`/medical-records/${id}`, data);
    return unwrapObjectResponse<MedicalRecord>(response.data);
  }

  // Delete medical record
  async delete(id: string): Promise<void> {
    await api.delete(`/medical-records/${id}`);
  }

  // Get all templates
  async getTemplates(): Promise<Template[]> {
    const response = await api.get('/medical-records/templates');
    return unwrapArrayResponse<Template>(response.data);
  }

  // Get template by ID
  async getTemplateById(templateId: string): Promise<Template> {
    const response = await api.get(`/medical-records/templates/${templateId}`);
    return unwrapObjectResponse<Template>(response.data);
  }

  // Get template by medical record
  async getTemplateByMedicalRecord(id: string): Promise<Template> {
    const response = await api.get(`/medical-records/${id}/template`);
    return unwrapObjectResponse<Template>(response.data);
  }
}

export const medicalRecordService = new MedicalRecordService();
