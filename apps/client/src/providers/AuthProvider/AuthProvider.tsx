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
  getAuthToken,
  removeAuthToken,
  setAuthToken,
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
  token: string | null;
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
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const applyAuthResponse = useCallback((response: AuthResponse) => {
    setAuthToken(response.token);
    setToken(response.token);
    setUser(response.user);
    setStatus('authenticated');
  }, []);

  const clearAuthState = useCallback(() => {
    removeAuthToken();
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const savedToken = getAuthToken();

    if (!savedToken) {
      clearAuthState();
      return null;
    }

    try {
      setStatus('loading');

      const response = await getCurrentUser(savedToken);

      setToken(savedToken);
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
    const currentToken = token ?? getAuthToken();

    try {
      if (currentToken) {
        await logoutUser(currentToken);
      }
    } finally {
      clearAuthState();
    }
  }, [clearAuthState, token]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      const savedToken = getAuthToken();

      if (!savedToken) {
        if (isMounted) {
          setStatus('unauthenticated');
        }

        return;
      }

      try {
        const response = await getCurrentUser(savedToken);

        if (!isMounted) return;

        setToken(savedToken);
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
      token,
      status,
      isAuthenticated: status === 'authenticated',
      isAuthReady: status !== 'loading',
      login,
      register,
      logout,
      refreshCurrentUser,
    }),
    [login, logout, refreshCurrentUser, register, status, token, user]
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
