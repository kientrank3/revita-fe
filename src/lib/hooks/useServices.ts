import { useState, useEffect, useCallback } from 'react';
import { serviceApi } from '@/lib/api';
import { Service } from '@/lib/types/work-session';

interface ServicesApiResponse {
  success: boolean;
  message: string;
  data: {
    services: Service[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}


interface UseServicesReturn {
  services: Service[];
  allServices: Service[];
  loading: boolean;
  error: string | null;
  total: number;
  refetch: () => Promise<void>;
  filterServices: (query: string) => void;
}

export function useServices(): UseServicesReturn {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await serviceApi.getAll();
      
      // Extract services from API response with correct structure
      const responseData = response.data as ServicesApiResponse;
      const servicesData = responseData?.data?.services || [];
      const validServices = Array.isArray(servicesData) ? servicesData : [];
      const totalCount = responseData?.data?.pagination?.total || validServices.length;
      
      setAllServices(validServices);
      setServices(validServices); // Initially show all services
      setTotal(totalCount);
    } catch (err) {
      console.error('Error fetching services:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tải dịch vụ');
      setAllServices([]);
      setServices([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterServices = useCallback((query: string) => {
    if (!query.trim()) {
      setServices(allServices);
      return;
    }

    const searchTerm = query.trim().toLowerCase();
    const filtered = allServices.filter(service => 
      service.name.toLowerCase().includes(searchTerm) ||
      service.serviceCode.toLowerCase().includes(searchTerm) ||
      (service.description && service.description.toLowerCase().includes(searchTerm))
    );
    
    setServices(filtered);
  }, [allServices]);

  const refetch = async () => {
    await fetchServices();
  };

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    allServices,
    loading,
    error,
    total,
    refetch,
    filterServices,
  };
}
