import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import Api, { type User, TOKEN_KEY } from '../services/api';
import { isPublicAppPath, isProtectedAppPath } from '../utils/authPaths';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  isLoading: boolean;
  /** Increments when session is established or re-validated — use to refetch dashboard data. */
  sessionEpoch: number;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_RECHECK_MS = 30 * 60 * 1000; // 30 minutes

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

function isUnauthorizedError(err: unknown): boolean {
  return (err as { response?: { status?: number } })?.response?.status === 401;
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
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const validatingRef = useRef(false);
  const lastValidatedAt = useRef(0);
  const redirectingRef = useRef(false);

  const bumpSession = useCallback(() => {
    setSessionEpoch((n) => n + 1);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem(TOKEN_KEY);
    redirectingRef.current = false;
    lastValidatedAt.current = 0;
  }, []);

  const redirectToLogin = useCallback(() => {
    if (redirectingRef.current) return;

    const path = window.location.pathname;
    if (path.startsWith('/login') || path.startsWith('/register')) return;

    if (isPublicAppPath(path) && !isProtectedAppPath(path)) {
      clearSession();
      return;
    }

    redirectingRef.current = true;
    const fullPath = path + window.location.search;
    window.location.href = `/login?redirect=${encodeURIComponent(fullPath)}&session=expired`;
  }, [clearSession]);

  const validateSession = useCallback(async (force = false) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      clearSession();
      return false;
    }

    const now = Date.now();
    if (!force && now - lastValidatedAt.current < SESSION_RECHECK_MS) {
      return !!localStorage.getItem(TOKEN_KEY);
    }

    try {
      const response = await Api.getUser();
      const normalized = normalizeStoredUser(response.data as Record<string, unknown>);
      setUser(normalized);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(normalized));
      lastValidatedAt.current = now;
      // Only refetch dashboards on background re-validation — not on initial app boot.
      if (!force) {
        bumpSession();
      }
      return true;
    } catch (err: unknown) {
      if (isUnauthorizedError(err)) {
        clearSession();
        if (isProtectedAppPath(window.location.pathname)) {
          redirectToLogin();
        }
      }
      return false;
    }
  }, [clearSession, redirectToLogin, bumpSession]);

  const logout = useCallback(() => {
    Api.logout().catch(() => {});
    clearSession();
    lastValidatedAt.current = 0;
  }, [clearSession]);

  useEffect(() => {
    Api.setUnauthorizedHandler(() => {
      clearSession();
      if (isProtectedAppPath(window.location.pathname)) {
        redirectToLogin();
      }
    });

    return () => Api.setUnauthorizedHandler(null);
  }, [clearSession, redirectToLogin]);

  useEffect(() => {
    if (validatingRef.current) return;

    // Google OAuth callback stores the token from the URL — skip competing validation.
    if (window.location.pathname.startsWith('/auth/google/callback')) {
      setIsLoading(false);
      return;
    }

    validatingRef.current = true;

    (async () => {
      await validateSession(true);
      setIsLoading(false);
      validatingRef.current = false;
    })();
  }, [validateSession]);

  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (document.visibilityState !== 'visible') return;
      if (!localStorage.getItem(TOKEN_KEY)) return;
      if (!isProtectedAppPath(window.location.pathname)) return;

      hiddenAtRef.current = null;

      void validateSession(false);
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [validateSession, bumpSession]);

  const login = (userData: User, token: string) => {
    const normalized = normalizeStoredUser(userData as unknown as Record<string, unknown>);
    setUser(normalized);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(normalized));
    localStorage.setItem(TOKEN_KEY, token);
    lastValidatedAt.current = Date.now();
    redirectingRef.current = false;
    bumpSession();
  };

  const value: AuthContextType = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    isLoading,
    sessionEpoch,
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
