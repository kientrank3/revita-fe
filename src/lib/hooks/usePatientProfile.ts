import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { patientProfileApi, PatientProfile, CreatePatientProfileDto } from '@/lib/api';

interface UsePatientProfileProps {
  patientId?: string;
  patientProfileId?: string;
  autoLoad?: boolean;
}

export function usePatientProfile({ 
  patientId, 
  patientProfileId, 
  autoLoad = true 
}: UsePatientProfileProps = {}) {
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load patient profile
  const loadPatientProfile = useCallback(async () => {
    if (!patientId && !patientProfileId) {
      setError('Cần cung cấp patientId hoặc patientProfileId');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      if (patientProfileId) {
        response = await patientProfileApi.getById(patientProfileId);
      } else if (patientId) {
        response = await patientProfileApi.getByPatientId(patientId);
      }
      
      if (response?.data) {
        setPatientProfile(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin bệnh nhân';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, patientProfileId]);

  // Create patient profile
  const createPatientProfile = useCallback(async (data: CreatePatientProfileDto): Promise<PatientProfile> => {
    try {
      const response = await patientProfileApi.create(data);
      const newProfile = response.data;
      setPatientProfile(newProfile);
      toast.success('Tạo hồ sơ bệnh nhân thành công');
      return newProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo hồ sơ bệnh nhân';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Update patient profile
  const updatePatientProfile = useCallback(async (data: Partial<CreatePatientProfileDto>): Promise<PatientProfile> => {
    if (!patientProfile?.id) {
      throw new Error('Không tìm thấy ID hồ sơ bệnh nhân');
    }

    try {
      const response = await patientProfileApi.update(patientProfile.id, data);
      const updatedProfile = response.data;
      setPatientProfile(updatedProfile);
      toast.success('Cập nhật hồ sơ bệnh nhân thành công');
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật hồ sơ bệnh nhân';
      toast.error(errorMessage);
      throw err;
    }
  }, [patientProfile?.id]);

  // Delete patient profile
  const deletePatientProfile = useCallback(async (): Promise<void> => {
    if (!patientProfile?.id) {
      throw new Error('Không tìm thấy ID hồ sơ bệnh nhân');
    }

    try {
      await patientProfileApi.delete(patientProfile.id);
      setPatientProfile(null);
      toast.success('Xóa hồ sơ bệnh nhân thành công');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa hồ sơ bệnh nhân';
      toast.error(errorMessage);
      throw err;
    }
  }, [patientProfile?.id]);

  // Load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadPatientProfile();
    }
  }, [autoLoad, loadPatientProfile]);

  return {
    // State
    patientProfile,
    isLoading,
    error,
    
    // Actions
    loadPatientProfile,
    createPatientProfile,
    updatePatientProfile,
    deletePatientProfile,
    
    // Utilities
    refresh: loadPatientProfile,
  };
}
