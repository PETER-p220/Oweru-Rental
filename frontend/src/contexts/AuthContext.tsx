import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import Api, { type User, TOKEN_KEY } from '../services/api';

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

function normalizeStoredUser(raw: Record<string, unknown>): User {
  const userType = (raw.userType ?? raw.user_type ?? 'tenant') as User['user_type'];

  return {
    ...(raw as User),
    user_type: userType,
    userType,
    firstName: (raw.firstName ?? raw.first_name ?? '') as string,
    lastName: (raw.lastName ?? raw.last_name ?? '') as string,
  };
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem(TOKEN_KEY);
    if (raw && token) {
      return normalizeStoredUser(JSON.parse(raw) as Record<string, unknown>);
    }
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem(TOKEN_KEY);
  }
  return null;
};

const hasValidSession = (): boolean => {
  return !!(localStorage.getItem('user') && localStorage.getItem(TOKEN_KEY));
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasValidSession);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const validatingRef = useRef(false);

  const clearSession = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const validateSession = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      clearSession();
      return false;
    }

    try {
      const response = await Api.getUser();
      const normalized = normalizeStoredUser(response.data as Record<string, unknown>);
      setUser(normalized);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(normalized));
      return true;
    } catch {
      clearSession();
      return false;
    }
  }, [clearSession]);

  const logout = useCallback(() => {
    Api.logout().catch(() => {});
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    Api.setUnauthorizedHandler(() => {
      clearSession();
      const path = window.location.pathname + window.location.search;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.href = `/login?redirect=${encodeURIComponent(path)}&session=expired`;
      }
    });

    return () => Api.setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    if (validatingRef.current) return;
    validatingRef.current = true;

    (async () => {
      await validateSession();
      setIsLoading(false);
      validatingRef.current = false;
    })();
  }, [validateSession]);

  useEffect(() => {
    const onFocus = () => {
      if (!localStorage.getItem(TOKEN_KEY)) return;
      validateSession().catch(() => clearSession());
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [validateSession, clearSession]);

  const login = (userData: User, token: string) => {
    const normalized = normalizeStoredUser(userData as unknown as Record<string, unknown>);
    setUser(normalized);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(normalized));
    localStorage.setItem(TOKEN_KEY, token);
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
