'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  loginUser,
  logoutUser,
  registerUser,
  getCurrentUser,
} from '@/services';

import {
  getAuthSessionMarker,
  removeAuthSessionMarker,
  setAuthSessionMarker,
} from '@/lib/auth/auth-token-storage';

import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@/types';

//===================================================================

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: AuthUser | null;
  sessionMarker: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<AuthUser | null>;
};

//===================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

//===================================================================

type AuthProviderProps = {
  children: ReactNode;
};

//===================================================================

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionMarker, setSessionMarker] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const applyAuthResponse = useCallback((response: AuthResponse) => {
    setAuthSessionMarker();
    setSessionMarker(getAuthSessionMarker());
    setUser(response.user);
    setStatus('authenticated');
  }, []);

  const clearAuthState = useCallback(() => {
    removeAuthSessionMarker();
    setSessionMarker(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const savedSessionMarker = getAuthSessionMarker();

    if (!savedSessionMarker) {
      clearAuthState();
      return null;
    }

    try {
      setStatus('loading');

      const response = await getCurrentUser();

      setSessionMarker(savedSessionMarker);
      setUser(response.user);
      setStatus('authenticated');

      return response.user;
    } catch {
      clearAuthState();
      return null;
    }
  }, [clearAuthState]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginUser(payload);

      applyAuthResponse(response);

      return response;
    },
    [applyAuthResponse]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await registerUser(payload);

      applyAuthResponse(response);

      return response;
    },
    [applyAuthResponse]
  );

  const logout = useCallback(async () => {
    const currentSessionMarker = sessionMarker ?? getAuthSessionMarker();

    try {
      if (currentSessionMarker) {
        await logoutUser();
      }
    } finally {
      clearAuthState();
    }
  }, [clearAuthState, sessionMarker]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      const savedSessionMarker = getAuthSessionMarker();

      if (!savedSessionMarker) {
        if (isMounted) {
          setStatus('unauthenticated');
        }

        return;
      }

      try {
        const response = await getCurrentUser();

        if (!isMounted) return;

        setSessionMarker(savedSessionMarker);
        setUser(response.user);
        setStatus('authenticated');
      } catch {
        if (!isMounted) return;

        clearAuthState();
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuthState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      sessionMarker,
      status,
      isAuthenticated: status === 'authenticated',
      isAuthReady: status !== 'loading',
      login,
      register,
      logout,
      refreshCurrentUser,
    }),
    [login, logout, refreshCurrentUser, register, sessionMarker, status, user]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

//===================================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

export default AuthProvider;
