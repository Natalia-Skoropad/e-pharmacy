'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@e-pharmacy/types/auth';

import { serverManagedBrowserAuthSessionHintStorage } from '../session/server-managed-browser-auth-session-hint-storage';

import {
  createBrowserAuthSessionSync,
  type AuthSessionEvent,
  type AuthSessionSync,
} from '../session/browser-auth-session-sync';

import { waitForAuthAttempt } from './auth-attempt-timeout';

import {
  createAuthenticatedAuthState,
  createBootstrappingAuthState,
  createUnauthenticatedAuthState,
  createUnavailableAuthState,
} from './auth-state-transitions';

import { AuthRequestManager } from './auth-request-manager';

import type {
  AuthContextValue,
  AuthProviderCoreProps,
  AuthState,
  AuthUnauthenticatedReason,
} from './auth-provider.types';

//===================================================================

const AuthContext = createContext<AuthContextValue | null>(null);
const DEFAULT_AUTH_BOOTSTRAP_TIMEOUT_MS = 4_000;

const INVALID_SESSION_CODES = new Set([
  'AUTH_SESSION_INVALID',
  'AUTH_SESSION_REVOKED',
]);

const BLOCKED_USER_CODES = new Set(['AUTH_USER_BLOCKED']);

//===================================================================

class AuthBootstrapTimeoutError extends Error {
  constructor() {
    super('Auth bootstrap timed out.');
    this.name = 'AuthBootstrapTimeoutError';
  }
}

//===================================================================

type ErrorLike = {
  status?: unknown;
  code?: unknown;
  payload?: unknown;
  data?: unknown;
  response?: unknown;
};

//===================================================================

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const value = error as ErrorLike;

  if (typeof value.status === 'number') return value.status;
  if (value.response && typeof value.response === 'object') {
    const responseStatus = (value.response as ErrorLike).status;
    if (typeof responseStatus === 'number') return responseStatus;
  }

  return null;
}

//===================================================================

function readCode(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const code = (value as ErrorLike).code;
  return typeof code === 'string' ? code : null;
}

//===================================================================

function getAuthBusinessCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const value = error as ErrorLike;

  for (const candidate of [value.payload, value.data, value.response]) {
    const directCode = readCode(candidate);
    if (directCode) return directCode;

    if (candidate && typeof candidate === 'object') {
      const nestedData = (candidate as ErrorLike).data;
      const nestedCode = readCode(nestedData);
      if (nestedCode) return nestedCode;
    }
  }

  const directCode = readCode(error);
  return directCode && directCode.startsWith('AUTH_') ? directCode : null;
}

//===================================================================

function getInvalidSessionReason(
  error: unknown
): AuthUnauthenticatedReason | null {
  const code = getAuthBusinessCode(error);

  if (code && INVALID_SESSION_CODES.has(code)) {
    return code === 'AUTH_SESSION_REVOKED'
      ? 'session_revoked'
      : 'session_invalid';
  }

  if (code && BLOCKED_USER_CODES.has(code)) return 'user_blocked';

  // Temporary legacy fallback until every auth endpoint emits stable codes.
  // A generic 403 is intentionally not treated as an invalid session.
  return getErrorStatus(error) === 401 ? 'session_invalid' : null;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

//===================================================================

export function AuthProviderCore(props: AuthProviderCoreProps) {
  const {
    children,
    getCurrentUser,
    login: loginService,
    register: registerService,
    logout: logoutService,
    bootstrapMode,
    bootstrapTimeoutMs = DEFAULT_AUTH_BOOTSTRAP_TIMEOUT_MS,
    revalidateOnFocus = true,
  } = props;

  const sessionHintStorage =
    bootstrapMode === 'session-hint'
      ? (props.sessionHintStorage ?? serverManagedBrowserAuthSessionHintStorage)
      : null;

  const initialState = createBootstrappingAuthState();

  const [state, setState] = useState<AuthState>(initialState);
  const stateRef = useRef<AuthState>(initialState);
  const mountedRef = useRef(true);
  const requestManagerRef = useRef(new AuthRequestManager());
  const bootstrapPromiseRef = useRef<Promise<AuthUser | null> | null>(null);
  const sessionSyncRef = useRef<AuthSessionSync | null>(null);

  const transition = useCallback((nextState: AuthState) => {
    stateRef.current = nextState;
    if (mountedRef.current) setState(nextState);
  }, []);

  const publishSessionEvent = useCallback((event: AuthSessionEvent) => {
    sessionSyncRef.current?.publish(event);
  }, []);

  const applyAuthenticatedUser = useCallback(
    (nextUser: AuthUser, publish = true) => {
      transition(createAuthenticatedAuthState(nextUser));

      if (publish) publishSessionEvent('authenticated');
    },
    [publishSessionEvent, transition]
  );

  const clearAuthState = useCallback(
    (reason: AuthUnauthenticatedReason, publish = true) => {
      transition(createUnauthenticatedAuthState(reason));

      if (publish) publishSessionEvent('unauthenticated');
    },
    [publishSessionEvent, transition]
  );

  const markUnavailable = useCallback(
    (error: unknown, preservedUser: AuthUser | null) => {
      transition(createUnavailableAuthState(error, preservedUser));
    },
    [transition]
  );

  const executeCurrentUserAttempt = useCallback(
    async (
      mode: 'bootstrap' | 'reload',
      timeoutMs?: number
    ): Promise<AuthUser | null> => {
      const manager = requestManagerRef.current;
      const previousState = stateRef.current;
      const preservedUser =
        mode === 'reload' && previousState.user ? previousState.user : null;

      if (mode === 'reload' && previousState.status === 'authenticated') {
        transition(createAuthenticatedAuthState(previousState.user, true));
      }

      const attempt = manager.start(
        'current-user',
        (signal) => getCurrentUser({ signal }),
        { singleFlight: true }
      );

      const outcome = await waitForAuthAttempt(attempt, timeoutMs, () =>
        manager.cancel(attempt)
      );

      if (outcome.type === 'timeout') {
        markUnavailable(new AuthBootstrapTimeoutError(), null);
        return null;
      }

      if (!manager.isCurrent(attempt)) return null;

      if (outcome.type === 'response') {
        applyAuthenticatedUser(outcome.response.user, false);
        return outcome.response.user;
      }

      if (isAbortError(outcome.error)) return null;

      const invalidReason = getInvalidSessionReason(outcome.error);
      if (invalidReason) {
        clearAuthState(invalidReason, mode !== 'bootstrap');
        return null;
      }

      markUnavailable(outcome.error, preservedUser);
      return null;
    },
    [
      applyAuthenticatedUser,
      clearAuthState,
      getCurrentUser,
      markUnavailable,
      transition,
    ]
  );

  const startBootstrap = useCallback(
    (forceNewAttempt = false): Promise<AuthUser | null> => {
      if (forceNewAttempt) {
        requestManagerRef.current.advanceLifecycle();
        bootstrapPromiseRef.current = null;
      } else if (bootstrapPromiseRef.current) {
        return bootstrapPromiseRef.current;
      }

      if (bootstrapMode === 'session-hint' && !sessionHintStorage?.hasHint()) {
        requestManagerRef.current.advanceLifecycle();
        clearAuthState('no_session_hint', false);
        return Promise.resolve(null);
      }

      requestManagerRef.current.advanceLifecycle();
      transition(createBootstrappingAuthState());

      const promise = executeCurrentUserAttempt(
        'bootstrap',
        bootstrapTimeoutMs
      ).finally(() => {
        if (bootstrapPromiseRef.current === promise) {
          bootstrapPromiseRef.current = null;
        }
      });

      bootstrapPromiseRef.current = promise;
      return promise;
    },
    [
      bootstrapMode,
      bootstrapTimeoutMs,
      clearAuthState,
      executeCurrentUserAttempt,
      sessionHintStorage,
      transition,
    ]
  );

  const retryAuthBootstrap = useCallback(
    () => startBootstrap(true),
    [startBootstrap]
  );

  const reloadCurrentUser = useCallback(async () => {
    const nextUser = await executeCurrentUserAttempt('reload');

    if (nextUser) publishSessionEvent('revalidate');
    return nextUser;
  }, [executeCurrentUserAttempt, publishSessionEvent]);

  const login = useMemo<AuthContextValue['login']>(() => {
    if (!loginService) return undefined;

    return async (payload: LoginPayload) => {
      const manager = requestManagerRef.current;
      manager.advanceLifecycle();

      const attempt = manager.start('login', (signal) =>
        loginService(payload, { signal })
      );

      try {
        const response = await attempt.promise;
        if (!manager.isCurrent(attempt)) return null;
        applyAuthenticatedUser(response.user);
        return response.user;
      } catch (error) {
        if (!manager.isCurrent(attempt) || isAbortError(error)) return null;
        throw error;
      }
    };
  }, [applyAuthenticatedUser, loginService]);

  const register = useMemo<AuthContextValue['register']>(() => {
    if (!registerService) return undefined;

    return async (payload: RegisterPayload) => {
      const manager = requestManagerRef.current;
      manager.advanceLifecycle();

      const attempt = manager.start('register', (signal) =>
        registerService(payload, { signal })
      );

      try {
        const response = await attempt.promise;
        if (!manager.isCurrent(attempt)) return null;
        applyAuthenticatedUser(response.user);
        return response.user;
      } catch (error) {
        if (!manager.isCurrent(attempt) || isAbortError(error)) return null;
        throw error;
      }
    };
  }, [applyAuthenticatedUser, registerService]);

  const invalidateSession = useCallback(
    (reason: AuthUnauthenticatedReason = 'session_invalid') => {
      requestManagerRef.current.advanceLifecycle();
      bootstrapPromiseRef.current = null;
      clearAuthState(reason);
    },
    [clearAuthState]
  );

  const logout = useCallback(async () => {
    const manager = requestManagerRef.current;
    manager.advanceLifecycle();
    bootstrapPromiseRef.current = null;
    clearAuthState('logout');

    const attempt = manager.start('logout', (signal) =>
      logoutService({ signal })
    );

    try {
      await attempt.promise;
    } catch (error) {
      if (!isAbortError(error) && manager.isCurrent(attempt)) throw error;
    }
  }, [clearAuthState, logoutService]);

  useEffect(() => {
    const requestManager = requestManagerRef.current;

    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestManager.advanceLifecycle();
      bootstrapPromiseRef.current = null;
    };
  }, []);

  useEffect(() => {
    const sync = createBrowserAuthSessionSync();
    sessionSyncRef.current = sync;

    const unsubscribe = sync.subscribe((event) => {
      requestManagerRef.current.advanceLifecycle();
      bootstrapPromiseRef.current = null;

      if (event === 'unauthenticated') {
        clearAuthState('external_session_event', false);
        return;
      }

      if (stateRef.current.user) {
        void executeCurrentUserAttempt('reload');
      } else {
        transition(createBootstrappingAuthState());
        void executeCurrentUserAttempt('bootstrap');
      }
    });

    const handleFocusRevalidation = () => {
      if (
        document.visibilityState !== 'visible' ||
        stateRef.current.status === 'bootstrapping'
      ) {
        return;
      }

      // BroadcastChannel is same-origin only. Revalidate both authenticated
      // and unauthenticated memory state so client and pharmacy applications
      // can observe login/logout changes after focus or visibility returns.
      const hadAuthenticatedUser = Boolean(stateRef.current.user);

      void executeCurrentUserAttempt('reload').then((nextUser) => {
        if (nextUser && !hadAuthenticatedUser) {
          publishSessionEvent('authenticated');
        }
      });
    };

    if (revalidateOnFocus) {
      window.addEventListener('focus', handleFocusRevalidation);
      document.addEventListener('visibilitychange', handleFocusRevalidation);
    }

    return () => {
      unsubscribe();
      sync.close();
      sessionSyncRef.current = null;

      if (revalidateOnFocus) {
        window.removeEventListener('focus', handleFocusRevalidation);
        document.removeEventListener(
          'visibilitychange',
          handleFocusRevalidation
        );
      }
    };
  }, [
    clearAuthState,
    executeCurrentUserAttempt,
    publishSessionEvent,
    revalidateOnFocus,
    transition,
  ]);

  useEffect(() => {
    void startBootstrap();
  }, [startBootstrap]);

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = state.status === 'authenticated';
    const isBootstrapping = state.status === 'bootstrapping';
    const isUnavailable = state.status === 'unavailable';

    return {
      state,
      user: state.user,
      status: state.status,
      authError: state.status === 'unavailable' ? state.error : null,
      capabilities: {
        canLogin: Boolean(login),
        canRegister: Boolean(register),
      },
      isAuthenticated,
      isBootstrapping,
      isUnavailable,
      canRenderAuthenticatedContent: isAuthenticated,
      canRenderGuestContent: state.status === 'unauthenticated',
      login,
      register,
      logout,
      invalidateSession,
      isRefreshingUser:
        state.status === 'authenticated' && state.isRevalidating,
      reloadCurrentUser,
      retryAuthBootstrap,
    };
  }, [
    invalidateSession,
    login,
    logout,
    register,
    reloadCurrentUser,
    retryAuthBootstrap,
    state,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

//===================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProviderCore');
  }

  return context;
}
