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
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
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
  const [sessionMarker, setSessionMarker] = useState<string | null>(() =>
    getAuthSessionMarker()
  );
  const [status, setStatus] = useState<AuthStatus>('loading');

  const syncAuthMarker = useCallback(() => {
    setAuthSessionMarker();
    setSessionMarker(getAuthSessionMarker());
  }, []);

  const applyAuthResponse = useCallback(
    (response: AuthResponse) => {
      syncAuthMarker();
      setUser(response.user);
      setStatus('authenticated');
    },
    [syncAuthMarker]
  );

  const clearAuthState = useCallback(() => {
    removeAuthSessionMarker();
    setSessionMarker(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    try {
      setStatus('loading');

      const response = await getCurrentUser();

      syncAuthMarker();
      setUser(response.user);
      setStatus('authenticated');

      return response.user;
    } catch {
      try {
        const response = await refreshSession();

        syncAuthMarker();
        setUser(response.user);
        setStatus('authenticated');

        return response.user;
      } catch {
        clearAuthState();
        return null;
      }
    }
  }, [clearAuthState, syncAuthMarker]);

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
    try {
      await logoutUser();
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      if (!getAuthSessionMarker()) {
        if (!isMounted) return;

        clearAuthState();
        return;
      }

      try {
        const response = await getCurrentUser();

        if (!isMounted) return;

        syncAuthMarker();
        setUser(response.user);
        setStatus('authenticated');
      } catch {
        try {
          const response = await refreshSession();

          if (!isMounted) return;

          syncAuthMarker();
          setUser(response.user);
          setStatus('authenticated');
        } catch {
          if (!isMounted) return;

          clearAuthState();
        }
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuthState, syncAuthMarker]);

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
