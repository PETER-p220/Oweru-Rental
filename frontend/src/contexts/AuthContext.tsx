import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: 'tenant' | 'landlord' | 'agent' | 'admin';
  user_type?: string;
  role?: string;
  userRole?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to safely read from localStorage
const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (raw && token) {
      return JSON.parse(raw) as User;
    }
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
  return null;
};

const hasValidSession = (): boolean => {
  return !!(localStorage.getItem('user') && localStorage.getItem('token'));
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Lazy initializers read localStorage synchronously on first render.
  // This prevents the "isAuthenticated = false flash" that causes logout on refresh.
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasValidSession);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('AuthContext - useEffect running');
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    console.log('AuthContext - Loading user from localStorage:', raw);
    console.log('AuthContext - Current token:', token);
    
    if (raw && token) {
      try {
        const parsedUser = JSON.parse(raw);
        console.log('AuthContext - Parsed user:', parsedUser);
        console.log('AuthContext - User type:', parsedUser.userType);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('AuthContext - Authentication state set to true');
      } catch (e) {
        console.error('Error parsing user:', e);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      console.log('AuthContext - No user or token found in localStorage');
      console.log('AuthContext - User found:', !!raw);
      console.log('AuthContext - Token found:', !!token);
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value: AuthContextType = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;