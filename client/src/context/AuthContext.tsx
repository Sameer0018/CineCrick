'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';

interface AuthContextType {
  token: string | null;
  email: string | null;
  isAdmin: boolean;
  streak: number;
  longestStreak: number;
  isLoggedIn: boolean;
  loading: boolean;
  login: (token: string, refreshToken: string, email: string, isAdmin: boolean) => void;
  logout: () => void;
  updateStreak: (current: number, longest: number) => void;
  refreshStreak: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshStreak = async () => {
    try {
      const data = await apiRequest('/api/dashboard/me');
      setStreak(data.currentStreak);
      setLongestStreak(data.longestStreak);
    } catch (err) {
      console.error('Failed to fetch streak:', err);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('email');
    const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';

    if (storedToken && storedEmail) {
      setToken(storedToken);
      setEmail(storedEmail);
      setIsAdmin(storedIsAdmin);
      // Fetch streak information
      apiRequest('/api/dashboard/me')
        .then(data => {
          setStreak(data.currentStreak);
          setLongestStreak(data.longestStreak);
        })
        .catch(err => console.error('Error fetching initial user streak:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string, refreshToken: string, email: string, isAdmin: boolean) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('email', email);
    localStorage.setItem('isAdmin', String(isAdmin));
    
    setToken(token);
    setEmail(email);
    setIsAdmin(isAdmin);
    
    refreshStreak();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('email');
    localStorage.removeItem('isAdmin');

    setToken(null);
    setEmail(null);
    setIsAdmin(false);
    setStreak(0);
    setLongestStreak(0);
  };

  const updateStreak = (current: number, longest: number) => {
    setStreak(current);
    setLongestStreak(longest);
  };

  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider value={{
      token,
      email,
      isAdmin,
      streak,
      longestStreak,
      isLoggedIn,
      loading,
      login,
      logout,
      updateStreak,
      refreshStreak
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
