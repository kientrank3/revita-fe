// Work Session Types
export type WorkSessionStatus = 
  | 'PENDING'
  | 'APPROVED' 
  | 'REJECTED'
  | 'CANCELLED';

export type UserType = 'DOCTOR' | 'TECHNICIAN';

export interface Service {
  service?: Service;
  id: string;
  serviceCode: string;
  name: string;
  description?: string;
  price?: number;
  timePerPatient?: number;
}

export interface Booth {
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
}

export interface WorkSessionService {
  id: string;
  workSessionId: string;
  serviceId: string;
  service: Service;
}

export interface WorkSession {
  id: string;
  startTime: string;
  endTime: string;
  status: WorkSessionStatus;
  nextAvailableAt?: string;
  booth?: Booth;
  services: WorkSessionService[];
  doctor?: {
    id: string;
    doctorCode: string;
    name: string;
    auth: {
      name: string;
      email?: string;
    };
  };
  technician?: {
    id: string;
    technicianCode: string;
    name: string;
    auth: {
      name: string;
      email?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// DTO Types for API requests
export interface CreateWorkSessionDto {
  workSessions: {
    startTime: string;
    endTime: string;
    serviceIds: string[];
  }[];
}

export interface UpdateWorkSessionDto {
  startTime?: string;
  endTime?: string;
  status?: WorkSessionStatus;
  boothId?: string;
  serviceIds?: string[];
}

export interface GetWorkSessionsQuery {
  startDate?: string;
  endDate?: string;
  status?: WorkSessionStatus;
  userType?: UserType;
  limit?: number;
  offset?: number;
}

export interface GetUserWorkSessionsQuery {
  userType: UserType;
  startDate?: string;
  endDate?: string;
}

// Response Types
export interface WorkSessionResponse {
  success: boolean;
  message: string;
  data: WorkSession;
}

export interface WorkSessionsResponse {
  success: boolean;
  message: string;
  data: WorkSession[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface CreateWorkSessionResponse {
  success: boolean;
  message: string;
  data: WorkSession[];
}

// Calendar Event Type for FullCalendar
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    workSession: WorkSession;
    status: WorkSessionStatus;
    services: WorkSessionService[];
    booth?: Booth;
  };
}

// Status colors for calendar events
export const WorkSessionStatusColors = {
  PENDING: {
    backgroundColor: '#FFF7ED', // amber-50
    borderColor: '#F59E0B',     // amber-500
    textColor: '#B45309'        // amber-700
  },
  APPROVED: {
    backgroundColor: '#ECFEFF', // cyan-50
    borderColor: '#35B8CF',     // brand cyan
    textColor: '#0E7490'        // cyan-700
  },
  REJECTED: {
    backgroundColor: '#FEF2F2', // red-50
    borderColor: '#EF4444',     // red-500
    textColor: '#991B1B'        // red-800
  },
  CANCELLED: {
    backgroundColor: '#F8FAFC', // slate-50
    borderColor: '#94A3B8',     // slate-400
    textColor: '#334155'        // slate-700
  }
} as const;

// Form types
export interface WorkSessionFormData {
  startTime: string;
  endTime: string;
  serviceIds: string[];
  date: string;
}

export interface WorkSessionConflict {
  id: string;
  startTime: string;
  endTime: string;
  services: Service[];
}

export interface ConflictValidationResult {
  hasConflict: boolean;
  conflicts: WorkSessionConflict[];
  message?: string;
}
