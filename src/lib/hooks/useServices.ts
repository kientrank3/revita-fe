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
  searchServices: (query: string) => Promise<void>;
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
      
      // Respect API limit (max 100)
      const response = await serviceApi.getAll({ limit: 100, offset: 0 });
      
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

  const searchServices = useCallback(async (query: string) => {
    const trimmed = query.trim();
    // When query empty, restore initial list
    if (!trimmed) {
      setServices(allServices);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Respect API limit (max 100)
      const response = await serviceApi.search({ query: trimmed, limit: 100, offset: 0 });
      const responseData = response.data as ServicesApiResponse;
      const servicesData = responseData?.data?.services || [];
      const validServices = Array.isArray(servicesData) ? servicesData : [];
      const totalCount = responseData?.data?.pagination?.total || validServices.length;

      setServices(validServices);
      setTotal(totalCount);
    } catch (err) {
      console.error('Error searching services:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tìm kiếm dịch vụ');
      setServices([]);
    } finally {
      setLoading(false);
    }
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
    searchServices,
  };
}
