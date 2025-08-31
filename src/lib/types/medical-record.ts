/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FieldDefinition {
  name: string;
  label: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required?: boolean;
  properties?: Record<string, any>;
  items?: {
    type: string;
    properties?: Record<string, any>;
  };
}

export interface Template {
  id: string;
  templateCode: string;
  name: string;
  specialtyName: string;
  fields: {
    [x: string]: any;
    fields: FieldDefinition[];
  };
}

export interface MedicalRecord {
  patientProfile: any;
  id: string;
  patientProfileId: string;
  templateId: string;
  doctorId?: string;
  appointmentId?: string;
  status: MedicalRecordStatus;
  content: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export enum MedicalRecordStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
}

export interface CreateMedicalRecordDto {
  patientProfileId: string;
  templateId: string;
  doctorId?: string;
  appointmentId?: string;
  status?: MedicalRecordStatus;
  content: Record<string, any>;
}

export interface UpdateMedicalRecordDto {
  content?: Record<string, any>;
  status?: MedicalRecordStatus;
}

export interface VitalSigns {
  temp?: number;
  bp?: string;
  hr?: number;
  rr?: number;
  o2_sat?: number;
  pain_score?: number;
  weight?: number;
  height?: number;
}

export interface Attachment {
  filename: string;
  filetype: string;
  url: string;
}
