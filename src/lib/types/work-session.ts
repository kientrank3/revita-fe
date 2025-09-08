// Work Session Types
export type WorkSessionStatus = 
  | 'PENDING'
  | 'APPROVED' 
  | 'REJECTED'
  | 'CANCELLED';

export type UserType = 'DOCTOR' | 'TECHNICIAN';

export interface Service {
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

export interface WorkSession {
  id: string;
  startTime: string;
  endTime: string;
  status: WorkSessionStatus;
  nextAvailableAt?: string;
  booth?: Booth;
  services: Service[];
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
    services: Service[];
    booth?: Booth;
  };
}

// Status colors for calendar events
export const WorkSessionStatusColors = {
  PENDING: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    textColor: '#92400e'
  },
  APPROVED: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    textColor: '#065f46'
  },
  REJECTED: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    textColor: '#991b1b'
  },
  CANCELLED: {
    backgroundColor: '#f3f4f6',
    borderColor: '#6b7280',
    textColor: '#374151'
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
