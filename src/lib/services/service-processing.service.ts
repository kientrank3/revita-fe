import api from '../config';
import {
  ScanPrescriptionResponse,
  UpdateServiceStatusRequest,
  UpdateServiceStatusResponse,
  UpdateServiceResultsRequest,
  UpdateServiceResultsResponse,
  GetMyServicesResponse,
  GetWorkSessionResponse,
  ServiceStatus
} from '../types/service-processing';

class ServiceProcessingService {
  private baseUrl = '/services';

  // Note: Backend extracts userId from JWT token, no need to set it manually

  // 1. SCAN PRESCRIPTION
  async scanPrescription(prescriptionCode: string): Promise<ScanPrescriptionResponse> {
    const response = await api.post(`${this.baseUrl}/scan-prescription`, {
      prescriptionCode
    });
    return response.data;
  }

  // 2. UPDATE SERVICE STATUS
  async updateServiceStatus(data: UpdateServiceStatusRequest): Promise<UpdateServiceStatusResponse> {
    const response = await api.put(`${this.baseUrl}/prescription-service/status`, data);
    return response.data;
  }

  // 3. UPDATE SERVICE RESULTS
  async updateServiceResults(data: UpdateServiceResultsRequest): Promise<UpdateServiceResultsResponse> {
    const response = await api.put(`${this.baseUrl}/prescription-service/results`, data);
    return response.data;
  }

  // 4. GET MY SERVICES
  async getMyServices(params?: {
    status?: ServiceStatus;
    workSessionId?: string;
    limit?: number;
    offset?: number;
  }): Promise<GetMyServicesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.workSessionId) queryParams.append('workSessionId', params.workSessionId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `${this.baseUrl}/my-services?${queryString}` : `${this.baseUrl}/my-services`;

    console.log('Calling GET MY SERVICES:', url);
    console.log('JWT Token should be in Authorization header automatically');

    const response = await api.get(url);
    return response.data;
  }

  // 5. GET CURRENT WORK SESSION
  async getCurrentWorkSession(): Promise<GetWorkSessionResponse> {
    console.log('Calling GET WORK SESSION');
    console.log('JWT Token should be in Authorization header automatically');

    const response = await api.get(`${this.baseUrl}/work-session`);
    return response.data;
  }

  // 6. START SERVICE (SHORTCUT)
  async startService(prescriptionServiceId: string): Promise<UpdateServiceStatusResponse> {
    const response = await api.post(`${this.baseUrl}/prescription-service/${prescriptionServiceId}/start`);
    return response.data;
  }

  // 7. COMPLETE SERVICE (SHORTCUT)
  async completeService(prescriptionServiceId: string): Promise<UpdateServiceStatusResponse> {
    const response = await api.post(`${this.baseUrl}/prescription-service/${prescriptionServiceId}/complete`);
    return response.data;
  }
}

// Test method to check if backend API is available
export const testBackendAPI = async (): Promise<boolean> => {
  try {
    console.log('Testing backend API availability');
    // Try to get work session to check if service processing API is working
    const response = await api.get('/api/services/work-session');
    console.log('Service processing API is available');
    return true;
  } catch (error: any) {
    console.error('Service processing API test failed:', error.response?.status, error.response?.data || error.message);
    return false;
  }
};

export const serviceProcessingService = new ServiceProcessingService();
export default serviceProcessingService;
