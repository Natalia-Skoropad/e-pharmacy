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

import type { AuthSessionHintStorage } from '../session/session-hint-storage';

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
  status: AuthStatus;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser | null>;
  register?: (payload: RegisterPayload) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<AuthUser | null>;
};

//===================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

//===================================================================

export type AuthProviderCoreProps = AuthProviderServices & {
  children: ReactNode;
  sessionHintStorage: AuthSessionHintStorage;
};

//===================================================================

export function AuthProviderCore({
  children,
  getCurrentUser,
  refreshSession,
  login: loginService,
  register: registerService,
  logout: logoutService,
  sessionHintStorage,
}: AuthProviderCoreProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const { hasHint, setHint, clearHint } = sessionHintStorage;

  const applyAuthenticatedUser = useCallback(
    (nextUser: AuthUser) => {
      setHint();
      setUser(nextUser);
      setStatus('authenticated');
    },
    [setHint]
  );

  const clearAuthState = useCallback(() => {
    clearHint();
    setUser(null);
    setStatus('unauthenticated');
  }, [clearHint]);

  const restoreCurrentUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();

      applyAuthenticatedUser(response.user);

      return response.user;
    } catch {
      try {
        const response = await refreshSession();

        applyAuthenticatedUser(response.user);

        return response.user;
      } catch {
        clearAuthState();

        return null;
      }
    }
  }, [applyAuthenticatedUser, clearAuthState, getCurrentUser, refreshSession]);

  const refreshCurrentUser = useCallback(async () => {
    setStatus('loading');

    return restoreCurrentUser();
  }, [restoreCurrentUser]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginService(payload);

      applyAuthenticatedUser(response.user);

      return response.user;
    },
    [applyAuthenticatedUser, loginService]
  );

  const register = useMemo(() => {
    if (!registerService) return undefined;

    return async (payload: RegisterPayload) => {
      const response = await registerService(payload);

      applyAuthenticatedUser(response.user);

      return response.user;
    };
  }, [applyAuthenticatedUser, registerService]);

  const logout = useCallback(async () => {
    try {
      await logoutService();
    } finally {
      clearAuthState();
    }
  }, [clearAuthState, logoutService]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      if (!hasHint()) {
        if (!isMounted) return;

        clearAuthState();
        return;
      }

      try {
        const response = await getCurrentUser();

        if (!isMounted) return;

        applyAuthenticatedUser(response.user);
      } catch {
        try {
          const response = await refreshSession();

          if (!isMounted) return;

          applyAuthenticatedUser(response.user);
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
  }, [
    applyAuthenticatedUser,
    clearAuthState,
    getCurrentUser,
    hasHint,
    refreshSession,
  ]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isAuthReady: status !== 'loading',
      login,
      register,
      logout,
      refreshCurrentUser,
    }),
    [login, logout, refreshCurrentUser, register, status, user]
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
