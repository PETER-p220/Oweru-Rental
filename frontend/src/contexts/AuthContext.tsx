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
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  console.log('AuthContext - AuthProvider initialized');
  console.log('AuthContext - Current localStorage user:', localStorage.getItem('user'));
  console.log('AuthContext - Current localStorage token:', localStorage.getItem('token'));

  useEffect(() => {
    console.log('AuthContext - useEffect running');
    const raw = localStorage.getItem('user');
    console.log('AuthContext - Loading user from localStorage:', raw);
    if (raw) {
      try {
        const parsedUser = JSON.parse(raw);
        console.log('AuthContext - Parsed user:', parsedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Error parsing user:', e);
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      console.log('AuthContext - No user found in localStorage');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const login = (userData: User) => {
    console.log('AuthContext - Login called with user:', userData);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('AuthContext - User saved to localStorage');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
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
