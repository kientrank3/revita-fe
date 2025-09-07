"use client";

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { AuthUser, AuthState, LoginCredentials, AuthResponse, UserRole } from '../types/auth';
import { authMiddleware, AuthContext as MiddlewareAuthContext } from '../middleware/auth';
import { authApi, userApi } from '../api';
import api from '../config';

// Safe localStorage utility for SSR
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore errors (e.g., when storage is full or disabled)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }
};

// Safe date formatting utility for SSR
const safeDateFormat = {
  toLocaleDateString: (date: Date, locale: string = 'vi-VN'): string => {
    if (typeof window === 'undefined') {
      // On server, return a consistent format
      return date.toISOString().split('T')[0];
    }
    return date.toLocaleDateString(locale);
  },
  toLocaleString: (date: Date, locale: string = 'vi-VN', options?: Intl.DateTimeFormatOptions): string => {
    if (typeof window === 'undefined') {
      // On server, return a consistent format
      return date.toISOString();
    }
    return date.toLocaleString(locale, options);
  }
};

interface AuthContextValue extends MiddlewareAuthContext {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateProfile: (data: Partial<AuthUser>) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Get auth context from middleware
      const authContext = await authMiddleware.getAuthContext();
      
      if (authContext.isAuthenticated && authContext.user) {
        const existingToken = safeLocalStorage.getItem('auth_token');
        setState({
          user: authContext.user,
          token: existingToken,
          isAuthenticated: true,
          isLoading: false,
        });
        authMiddleware.setCurrentUser(authContext.user);
        if (existingToken) {
          api.defaults.headers.common.Authorization = `Bearer ${existingToken}`;
        }
      } else {
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setError(null);
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await authApi.login(credentials);
      const data = response.data as unknown as Partial<AuthResponse> & { accessToken?: string };

      // Normalize tokens
      const token = (data as { token?: string; accessToken?: string }).token || data.accessToken || null;
      const refreshToken = (data as { refreshToken?: string }).refreshToken || null;
      if (!token) throw new Error('Token is missing in login response');

      safeLocalStorage.setItem('auth_token', token);
      if (refreshToken) safeLocalStorage.setItem('refresh_token', refreshToken);

      // Ensure axios instance sends Authorization header immediately (including this tab/session)
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Ensure we have user object; fetch if not provided
      let user = (data as { user?: AuthUser }).user as AuthUser | undefined;
      if (!user) {
        try {
          const me = await authApi.getMe();
          user = me.data as unknown as AuthUser;
        } catch (e) {
          console.error('Failed to fetch current user after login:', e);
        }
      }

      if (user) {
        safeLocalStorage.setItem('auth_user', JSON.stringify(user));
        // Update middleware cache
        authMiddleware.setCurrentUser(user);
      }

      // Update state
      setState({
        user: user ?? null,
        token,
        isAuthenticated: !!user,
        isLoading: false,
      });

      return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Đăng nhập thất bại';
      setError(errorMessage);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      await authApi.logout();
    } catch (error) {
      console.error('Error calling logout API:', error);
    } finally {
      // Clear local storage and state
      authMiddleware.logout();
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      setError(null);
      // Remove default Authorization header
      delete api.defaults.headers.common.Authorization;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = safeLocalStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refreshToken({ refreshToken });
      const authData: AuthResponse = response.data;

      // Update stored tokens
      safeLocalStorage.setItem('auth_token', authData.token);
      safeLocalStorage.setItem('refresh_token', authData.refreshToken);
      safeLocalStorage.setItem('auth_user', JSON.stringify(authData.user));

      // Update state
      setState(prev => ({
        ...prev,
        user: authData.user,
        token: authData.token,
      }));

      // Update middleware
      authMiddleware.setCurrentUser(authData.user);

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await logout();
      return false;
    }
  };

  const updateProfile = async (data: Partial<AuthUser>): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await userApi.updateProfile(data);
      const updatedUser = response.data;

      // Update stored user data
      safeLocalStorage.setItem('auth_user', JSON.stringify(updatedUser));

      // Update state
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      // Update middleware
      authMiddleware.setCurrentUser(updatedUser);

      return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Cập nhật thông tin thất bại';
      setError(errorMessage);
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    return authMiddleware.hasPermission(state.user, permission);
  };

  const hasRole = (role: UserRole): boolean => {
    return authMiddleware.hasRole(state.user, role);
  };

  const canAccessRoute = (route: string): boolean => {
    return authMiddleware.canAccessRoute(state.user, route);
  };

  const value: AuthContextValue = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    hasPermission,
    hasRole,
    canAccessRoute,
    login,
    logout,
    refreshToken,
    updateProfile,
    isLoading: state.isLoading,
    error,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks for specific roles
export function useIsAdmin() {
  const { hasRole } = useAuth();
  return hasRole('ADMIN');
}

export function useIsDoctor() {
  const { hasRole } = useAuth();
  return hasRole('DOCTOR');
}

export function useIsReceptionist() {
  const { hasRole } = useAuth();
  return hasRole('RECEPTIONIST');
}

export function useIsPatient() {
  const { hasRole } = useAuth();
  return hasRole('PATIENT');
}

// Permission hooks
export function useHasPermission(permission: string) {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

export function useCanAccessRoute(route: string) {
  const { canAccessRoute } = useAuth();
  return canAccessRoute(route);
}
