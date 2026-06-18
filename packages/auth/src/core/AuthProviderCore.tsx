'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

export type AuthProviderServices = {
  getCurrentUser: () => Promise<CurrentUserResponse>;
  refreshSession: () => Promise<CurrentUserResponse>;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register?: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
};

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  authError: unknown;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser | null>;
  register?: (payload: RegisterPayload) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<AuthUser | null>;
  retryAuthBootstrap: () => Promise<AuthUser | null>;
};

//===================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

//===================================================================

type AuthProviderCoreProps = AuthProviderServices & {
  children: ReactNode;
  sessionHintStorage: AuthSessionHintStorage;
};

type ErrorWithStatus = {
  status?: unknown;
  response?: { status?: unknown };
};

//===================================================================

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;

  const directStatus = (error as ErrorWithStatus).status;
  if (typeof directStatus === 'number') return directStatus;

  const responseStatus = (error as ErrorWithStatus).response?.status;
  return typeof responseStatus === 'number' ? responseStatus : null;
}

function isInvalidSessionError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 401 || status === 403;
}

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
  const [authError, setAuthError] = useState<unknown>(null);

  const lifecycleVersionRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<CurrentUserResponse> | null>(null);
  const bootstrapPromiseRef = useRef<Promise<AuthUser | null> | null>(null);

  const applyAuthenticatedUser = useCallback(
    (nextUser: AuthUser) => {
      sessionHintStorage.setHint();
      setAuthError(null);
      setUser(nextUser);
      setStatus('authenticated');
    },
    [sessionHintStorage]
  );

  const clearAuthState = useCallback(() => {
    sessionHintStorage.clearHint();
    setAuthError(null);
    setUser(null);
    setStatus('unauthenticated');
  }, [sessionHintStorage]);

  const markAuthUnavailable = useCallback((error: unknown) => {
    setAuthError(error);
    setUser(null);
    setStatus('error');
  }, []);

  const refreshSessionOnce = useCallback(() => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refreshSession().finally(() => {
        refreshPromiseRef.current = null;
      });
    }

    return refreshPromiseRef.current;
  }, [refreshSession]);

  const restoreCurrentUser = useCallback(async () => {
    const lifecycleVersion = lifecycleVersionRef.current;

    try {
      const response = await getCurrentUser();

      if (lifecycleVersion !== lifecycleVersionRef.current) return null;
      applyAuthenticatedUser(response.user);
      return response.user;
    } catch (currentUserError) {
      if (!isInvalidSessionError(currentUserError)) {
        if (lifecycleVersion === lifecycleVersionRef.current) {
          markAuthUnavailable(currentUserError);
        }
        return null;
      }

      try {
        const response = await refreshSessionOnce();

        if (lifecycleVersion !== lifecycleVersionRef.current) return null;
        applyAuthenticatedUser(response.user);
        return response.user;
      } catch (refreshError) {
        if (lifecycleVersion !== lifecycleVersionRef.current) return null;

        if (isInvalidSessionError(refreshError)) {
          clearAuthState();
        } else {
          markAuthUnavailable(refreshError);
        }

        return null;
      }
    }
  }, [
    applyAuthenticatedUser,
    clearAuthState,
    getCurrentUser,
    markAuthUnavailable,
    refreshSessionOnce,
  ]);

  const runBootstrap = useCallback(() => {
    if (!bootstrapPromiseRef.current) {
      setStatus('loading');
      setAuthError(null);
      bootstrapPromiseRef.current = restoreCurrentUser().finally(() => {
        bootstrapPromiseRef.current = null;
      });
    }

    return bootstrapPromiseRef.current;
  }, [restoreCurrentUser]);

  const refreshCurrentUser = useCallback(async () => {
    return restoreCurrentUser();
  }, [restoreCurrentUser]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      lifecycleVersionRef.current += 1;
      const response = await loginService(payload);
      applyAuthenticatedUser(response.user);
      return response.user;
    },
    [applyAuthenticatedUser, loginService]
  );

  const register = useMemo(() => {
    if (!registerService) return undefined;

    return async (payload: RegisterPayload) => {
      lifecycleVersionRef.current += 1;
      const response = await registerService(payload);
      applyAuthenticatedUser(response.user);
      return response.user;
    };
  }, [applyAuthenticatedUser, registerService]);

  const logout = useCallback(async () => {
    lifecycleVersionRef.current += 1;

    try {
      await logoutService();
    } finally {
      clearAuthState();
    }
  }, [clearAuthState, logoutService]);

  useEffect(() => {
    // The client-readable hint is intentionally not a source of truth.
    // HttpOnly access/refresh cookies can remain valid even when the hint is
    // missing, scoped to another host, or removed by the browser.
    void runBootstrap();
  }, [runBootstrap]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      authError,
      isAuthenticated: status === 'authenticated',
      isAuthReady: status !== 'loading',
      login,
      register,
      logout,
      refreshCurrentUser,
      retryAuthBootstrap: runBootstrap,
    }),
    [
      authError,
      login,
      logout,
      refreshCurrentUser,
      register,
      runBootstrap,
      status,
      user,
    ]
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
