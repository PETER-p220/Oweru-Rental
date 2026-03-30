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
    // Optional: validate the stored token against your backend here.
    // If the token is expired or invalid, call logout().
    // Example:
    // const token = localStorage.getItem('token');
    // if (token) {
    //   validateToken(token).catch(() => logout());
    // }

    // Mark auth as resolved so route guards know it's safe to act.
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