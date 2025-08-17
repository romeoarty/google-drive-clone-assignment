'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
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
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const router = useRouter();

  // Memoized API request function
  const makeAuthRequest = useCallback(async <T = unknown>(
    url: string, 
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies
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
      // Make a request to check auth - cookies will be sent automatically
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          // Invalid response
          setUser(null);
        }
      } else {
        // Not authenticated
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setHasCheckedAuth(true);
      setIsLoading(false);
    }
  }, []);

  // Login function with better error handling
  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await makeAuthRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (result.success && result.data) {
        const { user: userData } = result.data;
        setUser(userData);
        // Don't set client-side cookie - server handles it
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
      // Clear client-side state only
      setUser(null);
      router.push('/login');
    }
  }, [makeAuthRequest, router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [user]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    user,
    isLoading: isLoading || !hasCheckedAuth,
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