// Service Processing Types
export type ServiceStatus =
  | 'PENDING'
  | 'WAITING'
  | 'SERVING'
  | 'WAITING_RESULT'
  | 'COMPLETED'
  | 'DELAYED'
  | 'CANCELLED'
  | 'NOT_STARTED';

// DTO Types matching backend
export interface SearchServiceDto {
  query: string;
  limit?: number;
  offset?: number;
}

export interface GetAllServicesDto {
  limit?: number;
  offset?: number;
}

export interface ScanPrescriptionDto {
  prescriptionCode: string;
}

export interface UpdateServiceStatusDto {
  prescriptionServiceId: string;
  status: ServiceStatus;
  note?: string;
}

export interface UpdateServiceResultsDto {
  prescriptionServiceId: string;
  results: string[];
  note?: string;
}

export interface GetServicesDto {
  status?: ServiceStatus;
  workSessionId?: string;
  limit?: number;
  offset?: number;
}

export interface Service {
  id: string;
  serviceCode: string;
  name: string;
  price: number;
  description: string;
  timePerPatient: number;
}

export interface PrescriptionService {
  id: string;
  service: Service;
  status: ServiceStatus;
  order: number;
  note: string | null;
  startedAt: string | null;
  completedAt: string | null;
  results: string[];
}

export interface PatientProfile {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface Doctor {
  id: string;
  doctorCode: string;
  name: string;
}

export interface Technician {
  id: string;
  technicianCode: string;
  name: string;
}

export interface Prescription {
  id: string;
  prescriptionCode: string;
  status: string;
  note: string;
  patientProfile: PatientProfile;
  doctor: Doctor;
  services: PrescriptionService[];
}

export interface WorkSession {
  id: string;
  booth: {
    id: string;
    boothCode: string;
    name: string;
    room: {
      id: string;
      roomCode: string;
      roomName: string;
      specialty: {
        id: string;
        name: string;
      };
    };
  };
  startTime: string;
  endTime: string;
  nextAvailableAt: string;
}

export interface ScanPrescriptionResponseDto {
  success: boolean;
  message: string;
  data: {
    prescription: Prescription;
    services: PrescriptionService[];
  };
}

export interface UpdateServiceStatusResponseDto {
  success: boolean;
  message: string;
  data: {
    prescriptionService: PrescriptionService & {
      doctor?: Doctor;
      technician?: Technician;
    };
    prescription: {
      id: string;
      prescriptionCode: string;
      status: string;
    };
  };
}

export interface UpdateResultsResponseDto {
  success: boolean;
  message: string;
  data: {
    prescriptionService: PrescriptionService & {
      doctor?: Doctor;
      technician?: Technician;
    };
    prescription: {
      id: string;
      prescriptionCode: string;
      status: string;
    };
  };
}

export interface GetMyServicesResponse {
  success: boolean;
  message: string;
  data: {
    services: (PrescriptionService & {
      prescription: {
        id: string;
        prescriptionCode: string;
        status: string;
        patientProfile: PatientProfile;
      };
    })[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface GetWorkSessionResponse {
  success: boolean;
  message: string;
  data: {
    workSession: WorkSession;
    user: {
      id: string;
      role: string;
      technicianCode?: string;
      doctorCode?: string;
      name: string;
    };
  };
}

