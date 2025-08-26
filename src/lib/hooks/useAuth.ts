import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  avatar?: string;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateUserDto) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await authApi.getMe();
          setUser(response.data);
        } catch (err) {
          console.error('Failed to get user data:', err);
          // Token might be invalid, clear it
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authApi.login({ identifier, password });
      setUser(response.data.user);
      toast.success('Đăng nhập thành công');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const register = useCallback(async (_email: string, _password: string, _name?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Note: You'll need to implement register API in authApi
      // For now, this is a placeholder
      toast.error('Chức năng đăng ký chưa được implement');
      throw new Error('Chức năng đăng ký chưa được implement');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setError(null);
    toast.success('Đăng xuất thành công');
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateProfile = useCallback(async (_data: UpdateUserDto) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Note: You'll need to implement updateProfile API in authApi
      // For now, this is a placeholder
      toast.error('Chức năng cập nhật profile chưa được implement');
      throw new Error('Chức năng cập nhật profile chưa được implement');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cập nhật thất bại';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const response = await authApi.getMe();
        setUser(response.data);
      } catch (err) {
        console.error('Failed to refresh user data:', err);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user,
  };
}
