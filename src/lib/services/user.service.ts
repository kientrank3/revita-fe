import { User, UserSearchResponse } from "../types/user";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class UserService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/users${endpoint}`;
    
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

  // Search users by query (phone, email, or name)
  async searchUsers(query: string): Promise<UserSearchResponse> {
    return this.request<UserSearchResponse>(`/search?query=${encodeURIComponent(query)}`);
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/${id}`);
  }

  // Search doctors by query
  async searchDoctors(query: string): Promise<UserSearchResponse> {
    const response = await this.searchUsers(query);
    // Filter only doctors
    const doctors = response.users.filter(user => user.role === 'DOCTOR');
    return {
      query: response.query,
      total: doctors.length,
      users: doctors
    };
  }

  // Get doctor by ID using search
  async getDoctorById(id: string): Promise<User | null> {
    try {
      // Use search endpoint with the ID as query
      const response = await this.searchUsers(id);
      const doctor = response.users.find(user => user.id === id && user.role === 'DOCTOR');
      return doctor || null;
    } catch (error) {
      console.error('Error getting doctor by ID:', error);
      return null;
    }
  }

  // Get multiple doctors by IDs
  async getDoctorsByIds(ids: string[]): Promise<Record<string, User>> {
    if (ids.length === 0) return {};
    
    const doctorsMap: Record<string, User> = {};
    
    for (const id of ids) {
      try {
        const doctor = await this.getDoctorById(id);
        if (doctor) {
          doctorsMap[id] = doctor;
        }
      } catch (error) {
        console.error(`Error loading doctor ${id}:`, error);
      }
    }
    
    return doctorsMap;
  }
}

export const userService = new UserService();
