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
  getAuthSessionMarker,
  removeAuthSessionMarker,
  setAuthSessionMarker,
} from '../session/auth-token-storage';

import type {
  AuthResponse,
  AuthUser,
  CurrentUserResponse,
  LoginPayload,
  RegisterPayload,
} from '@e-pharmacy/types';

//===================================================================

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

//===================================================================

export type AuthProviderServices = {
  getCurrentUser: () => Promise<CurrentUserResponse>;
  refreshSession: () => Promise<CurrentUserResponse>;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register?: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
};

export type AuthContextValue = {
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

export type AuthProviderCoreProps = {
  children: ReactNode;
  services: AuthProviderServices;
};

//===================================================================

export function AuthProviderCore({
  children,
  services,
}: AuthProviderCoreProps) {
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

      const response = await services.getCurrentUser();

      syncAuthMarker();
      setUser(response.user);
      setStatus('authenticated');

      return response.user;
    } catch {
      try {
        const response = await services.refreshSession();

        syncAuthMarker();
        setUser(response.user);
        setStatus('authenticated');

        return response.user;
      } catch {
        clearAuthState();
        return null;
      }
    }
  }, [clearAuthState, services, syncAuthMarker]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await services.login(payload);

      applyAuthResponse(response);

      return response;
    },
    [applyAuthResponse, services]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      if (!services.register) {
        throw new Error('Registration is not available for this app.');
      }

      const response = await services.register(payload);

      applyAuthResponse(response);

      return response;
    },
    [applyAuthResponse, services]
  );

  const logout = useCallback(async () => {
    try {
      await services.logout();
    } finally {
      clearAuthState();
    }
  }, [clearAuthState, services]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      if (!getAuthSessionMarker()) {
        if (!isMounted) return;

        clearAuthState();
        return;
      }

      try {
        const response = await services.getCurrentUser();

        if (!isMounted) return;

        syncAuthMarker();
        setUser(response.user);
        setStatus('authenticated');
      } catch {
        try {
          const response = await services.refreshSession();

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
  }, [clearAuthState, services, syncAuthMarker]);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

//===================================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProviderCore');
  }

  return context;
}
