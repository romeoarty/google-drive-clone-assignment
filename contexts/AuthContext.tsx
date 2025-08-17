'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Memoized API request function
  const makeAuthRequest = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const token = Cookies.get('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Request failed' };
      }
    } catch (error) {
      console.error('Auth request error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }, []);

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get('token');
      
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const result = await makeAuthRequest('/api/auth/me');
      
      if (result.success && result.data?.user) {
        setUser(result.data.user);
      } else {
        // Invalid token, remove it
        Cookies.remove('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      Cookies.remove('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthRequest]);

  // Login function with better error handling
  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await makeAuthRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (result.success && result.data) {
        const { user: userData, token } = result.data;
        setUser(userData);
        Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'strict' });
        router.push('/dashboard');
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }, [makeAuthRequest, router]);

  // Register function with better error handling
  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const result = await makeAuthRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });

      if (result.success) {
        // After successful registration, log the user in
        return await login(email, password);
      } else {
        return { success: false, error: result.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }, [makeAuthRequest, login]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear server-side session
      await makeAuthRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear client-side state
      Cookies.remove('token');
      setUser(null);
      router.push('/login');
    }
  }, [makeAuthRequest, router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!user) return;
    
    try {
      const result = await makeAuthRequest('/api/auth/me');
      if (result.success && result.data?.user) {
        setUser(result.data.user);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [makeAuthRequest, user]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};