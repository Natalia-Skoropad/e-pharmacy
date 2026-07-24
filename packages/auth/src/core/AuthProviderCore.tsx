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

import type {
  AuthUser,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from '@e-pharmacy/types';

import {
  createBrowserAuthSessionSync,
  type AuthSessionSync,
} from '../session/browser-auth-session-sync';

import type { AuthSessionHintStorage } from '../session/session-hint-storage';
import type { AuthProviderServices } from './auth-provider.types';

//===================================================================

type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'auth_unavailable';

//===================================================================

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  authError: unknown;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser | null>;
  register?: (payload: RegisterPayload) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  isRefreshingUser: boolean;
  reloadCurrentUser: () => Promise<AuthUser | null>;
  retryAuthBootstrap: () => Promise<AuthUser | null>;
};

//===================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

//===================================================================

const AUTH_BOOTSTRAP_TIMEOUT_MS = 4_000;
const AUTH_SESSION_REFRESH_INTERVAL_MS = 6 * 60 * 1000;
const AUTH_SESSION_REFRESH_RETRY_DELAY_MS = 1_500;

//===================================================================
class AuthBootstrapTimeoutError extends Error {
  constructor() {
    super('Auth bootstrap timed out.');
    this.name = 'AuthBootstrapTimeoutError';
  }
}

//===================================================================

const noopSessionHintStorage: AuthSessionHintStorage = {
  hasHint: () => false,
  setHint: () => undefined,
  clearHint: () => undefined,
};

//===================================================================

type AuthProviderCoreProps = AuthProviderServices & {
  children: ReactNode;
  sessionHintStorage?: AuthSessionHintStorage;
  sessionSync?: AuthSessionSync;
  revalidateOnFocus?: boolean;
};

//===================================================================

const currentUserPromises = new WeakMap<
  AuthProviderServices['getCurrentUser'],
  Promise<AuthResponse>
>();

const refreshPromises = new WeakMap<
  AuthProviderServices['refreshSession'],
  Promise<AuthResponse>
>();

//===================================================================

function runSingleFlight(
  service: () => Promise<AuthResponse>,
  store: WeakMap<() => Promise<AuthResponse>, Promise<AuthResponse>>
): Promise<AuthResponse> {
  const pending = store.get(service);
  if (pending) return pending;

  const request = service().finally(() => {
    if (store.get(service) === request) store.delete(service);
  });

  store.set(service, request);
  return request;
}

//===================================================================

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

//===================================================================

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
  sessionHintStorage = noopSessionHintStorage,
  sessionSync,
  revalidateOnFocus = true,
}: AuthProviderCoreProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [authError, setAuthError] = useState<unknown>(null);
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);

  const lifecycleVersionRef = useRef(0);
  const bootstrapPromiseRef = useRef<Promise<AuthUser | null> | null>(null);
  const sessionHintStorageRef = useRef(sessionHintStorage);
  const sessionSyncRef = useRef<AuthSessionSync | null>(null);
  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    sessionHintStorageRef.current = sessionHintStorage;
  }, [sessionHintStorage]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const applyAuthenticatedUser = useCallback(
    (nextUser: AuthUser, publishSessionEvent = true) => {
      setAuthError(null);
      setIsRefreshingUser(false);
      setUser(nextUser);
      setStatus('authenticated');

      if (publishSessionEvent) {
        sessionSyncRef.current?.publish('authenticated');
      }
    },
    []
  );

  const clearAuthState = useCallback((publishSessionEvent = true) => {
    sessionHintStorageRef.current.clearHint();
    setAuthError(null);
    setIsRefreshingUser(false);
    setUser(null);
    setStatus('unauthenticated');
    if (publishSessionEvent) {
      sessionSyncRef.current?.publish('unauthenticated');
    }
  }, []);

  const markAuthUnavailable = useCallback(
    (error: unknown, preserveAuthenticatedState: boolean) => {
      setAuthError(error);
      setIsRefreshingUser(false);

      if (!preserveAuthenticatedState) {
        setUser(null);
        setStatus('auth_unavailable');
      }
    },
    []
  );

  const refreshSessionOnce = useCallback(
    () => runSingleFlight(refreshSession, refreshPromises),
    [refreshSession]
  );

  const restoreCurrentUser = useCallback(
    async (mode: 'bootstrap' | 'reload') => {
      const lifecycleVersion = lifecycleVersionRef.current;
      const preserveAuthenticatedState =
        mode === 'reload' && Boolean(userRef.current);

      try {
        const response = await runSingleFlight(
          getCurrentUser,
          currentUserPromises
        );

        if (lifecycleVersion !== lifecycleVersionRef.current) return null;
        applyAuthenticatedUser(response.user, false);
        return response.user;
      } catch (currentUserError) {
        if (!isInvalidSessionError(currentUserError)) {
          if (lifecycleVersion === lifecycleVersionRef.current) {
            markAuthUnavailable(currentUserError, preserveAuthenticatedState);
          }
          return null;
        }

        try {
          const response = await refreshSessionOnce();

          if (lifecycleVersion !== lifecycleVersionRef.current) return null;
          applyAuthenticatedUser(response.user, false);
          return response.user;
        } catch (refreshError) {
          if (lifecycleVersion !== lifecycleVersionRef.current) return null;

          if (isInvalidSessionError(refreshError)) {
            clearAuthState(false);
          } else {
            markAuthUnavailable(refreshError, preserveAuthenticatedState);
          }

          return null;
        }
      }
    },
    [
      applyAuthenticatedUser,
      clearAuthState,
      getCurrentUser,
      markAuthUnavailable,
      refreshSessionOnce,
    ]
  );

  const markBootstrapTimeout = useCallback((error: unknown) => {
    setAuthError(error);
    setIsRefreshingUser(false);
    setUser(null);
    setStatus('auth_unavailable');
  }, []);

  const runBootstrap = useCallback(() => {
    if (!sessionHintStorageRef.current.hasHint()) {
      clearAuthState(false);
      return Promise.resolve(null);
    }

    if (!bootstrapPromiseRef.current) {
      setStatus('loading');
      setAuthError(null);

      const restorePromise = restoreCurrentUser('bootstrap');

      let timeoutId: number | null = null;
      const timeoutPromise = new Promise<AuthUser | null>((resolve) => {
        timeoutId = window.setTimeout(() => {
          const timeoutError = new AuthBootstrapTimeoutError();
          markBootstrapTimeout(timeoutError);
          resolve(null);
        }, AUTH_BOOTSTRAP_TIMEOUT_MS);
      });

      bootstrapPromiseRef.current = Promise.race([
        restorePromise,
        timeoutPromise,
      ]).finally(() => {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        bootstrapPromiseRef.current = null;
      });
    }

    return bootstrapPromiseRef.current;
  }, [clearAuthState, markBootstrapTimeout, restoreCurrentUser]);

  const reloadCurrentUser = useCallback(async () => {
    const lifecycleVersion = lifecycleVersionRef.current;
    setIsRefreshingUser(true);

    try {
      return await restoreCurrentUser('reload');
    } finally {
      if (lifecycleVersion === lifecycleVersionRef.current) {
        setIsRefreshingUser(false);
      }
    }
  }, [restoreCurrentUser]);

  const refreshSessionWithRetry = useCallback(async () => {
    try {
      return await refreshSessionOnce();
    } catch (error) {
      if (isInvalidSessionError(error)) throw error;

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, AUTH_SESSION_REFRESH_RETRY_DELAY_MS);
      });

      return refreshSessionOnce();
    }
  }, [refreshSessionOnce]);

  const refreshActiveSession = useCallback(async () => {
    if (!userRef.current) return null;

    const lifecycleVersion = lifecycleVersionRef.current;
    setIsRefreshingUser(true);

    try {
      const response = await refreshSessionWithRetry();

      if (lifecycleVersion !== lifecycleVersionRef.current) return null;

      applyAuthenticatedUser(response.user, false);
      return response.user;
    } catch (refreshError) {
      if (lifecycleVersion !== lifecycleVersionRef.current) return null;

      if (isInvalidSessionError(refreshError)) {
        clearAuthState();
      } else {
        markAuthUnavailable(refreshError, true);
      }

      return null;
    } finally {
      if (lifecycleVersion === lifecycleVersionRef.current) {
        setIsRefreshingUser(false);
      }
    }
  }, [
    applyAuthenticatedUser,
    clearAuthState,
    markAuthUnavailable,
    refreshSessionWithRetry,
  ]);

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
    const ownsSync = !sessionSync;
    const sync = sessionSync ?? createBrowserAuthSessionSync();
    sessionSyncRef.current = sync;

    const unsubscribe = sync.subscribe((event) => {
      lifecycleVersionRef.current += 1;

      if (event === 'unauthenticated') {
        clearAuthState(false);
        return;
      }

      void restoreCurrentUser('reload');
    });

    const revalidateOnFocusHandler = () => {
      if (document.visibilityState === 'visible' && userRef.current) {
        void restoreCurrentUser('reload');
      }
    };

    if (revalidateOnFocus) {
      window.addEventListener('focus', revalidateOnFocusHandler);
      document.addEventListener('visibilitychange', revalidateOnFocusHandler);
    }

    return () => {
      unsubscribe();
      if (ownsSync) sync.close();
      sessionSyncRef.current = null;
      if (revalidateOnFocus) {
        window.removeEventListener('focus', revalidateOnFocusHandler);
        document.removeEventListener(
          'visibilitychange',
          revalidateOnFocusHandler
        );
      }
    };
  }, [clearAuthState, restoreCurrentUser, revalidateOnFocus, sessionSync]);

  useEffect(() => {
    if (status !== 'authenticated') return undefined;

    const intervalId = window.setInterval(() => {
      void refreshActiveSession();
    }, AUTH_SESSION_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [refreshActiveSession, status]);

  useEffect(() => {
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
      isRefreshingUser,
      reloadCurrentUser,
      retryAuthBootstrap: runBootstrap,
    }),

    [
      authError,
      login,
      logout,
      isRefreshingUser,
      reloadCurrentUser,
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
