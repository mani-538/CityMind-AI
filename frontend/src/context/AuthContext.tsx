'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export interface UserRole {
  id: string;
  name: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  is_verified: boolean;
  roles: UserRole[];
  department_id?: string;
  approval_status?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  token: string | null;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const clearAllAuthData = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('citymind_access_token');
    localStorage.removeItem('citymind_refresh_token');
    localStorage.removeItem('citymind_user');

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear any auth cookies
    document.cookie = 'citymind_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'citymind_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Clear React state
    setToken(null);
    setUser(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('citymind_user', JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error('Failed to fetch user profile — clearing session:', error);
      clearAllAuthData();
    } finally {
      setLoading(false);
    }
  }, [clearAllAuthData]);

  useEffect(() => {
    const storedToken = localStorage.getItem('citymind_access_token');
    if (storedToken) {
      setToken(storedToken);
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('citymind_access_token', accessToken);
    localStorage.setItem('citymind_refresh_token', refreshToken);
    setToken(accessToken);
    await fetchProfile();
  };

  const logout = useCallback(() => {
    clearAllAuthData();
    // Use replace so back button cannot return to protected page
    router.replace('/login');
  }, [clearAllAuthData, router]);

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    const userRoleNames = user.roles.map((r) => r.name);
    if (userRoleNames.includes('Super Admin')) return true;
    return roles.some((role) => userRoleNames.includes(role));
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
