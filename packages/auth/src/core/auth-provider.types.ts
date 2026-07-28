import type { ReactNode } from 'react';

import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@e-pharmacy/types/auth';

//===================================================================

export type AuthBootstrapMode = 'always' | 'session-hint';

//===================================================================

type AuthSessionHintReader = Readonly<{
  hasHint: () => boolean;
}>;

export type AuthServiceRequestOptions = Readonly<{
  signal: AbortSignal;
}>;

export type AuthProviderSessionServices = Readonly<{
  getCurrentUser: (options: AuthServiceRequestOptions) => Promise<AuthResponse>;
  logout: (options: AuthServiceRequestOptions) => Promise<void>;
}>;

export type AuthProviderInteractiveServices = Readonly<{
  login: (
    payload: LoginPayload,
    options: AuthServiceRequestOptions
  ) => Promise<AuthResponse>;
  register?: (
    payload: RegisterPayload,
    options: AuthServiceRequestOptions
  ) => Promise<AuthResponse>;
}>;

export type AuthProviderServices = AuthProviderSessionServices &
  Partial<AuthProviderInteractiveServices>;

//===================================================================

export type AuthUnauthenticatedReason =
  | 'no_session_hint'
  | 'session_invalid'
  | 'session_revoked'
  | 'user_blocked'
  | 'logout'
  | 'password_changed'
  | 'password_reset'
  | 'external_session_event';

//===================================================================

export type AuthState =
  | Readonly<{
      status: 'bootstrapping';
      user: null;
      error: null;
    }>
  | Readonly<{
      status: 'authenticated';
      user: AuthUser;
      error: null;
      isRevalidating: boolean;
    }>
  | Readonly<{
      status: 'unauthenticated';
      user: null;
      error: null;
      reason?: AuthUnauthenticatedReason;
    }>
  | Readonly<{
      status: 'unavailable';
      user: AuthUser | null;
      error: unknown;
    }>;

export type AuthStatus = AuthState['status'];

export type AuthCapabilities = Readonly<{
  canLogin: boolean;
  canRegister: boolean;
}>;

export type AuthContextValue = Readonly<{
  state: AuthState;
  user: AuthUser | null;
  status: AuthStatus;
  authError: unknown;
  capabilities: AuthCapabilities;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isUnavailable: boolean;
  canRenderAuthenticatedContent: boolean;
  canRenderGuestContent: boolean;
  login?: (payload: LoginPayload) => Promise<AuthUser | null>;
  register?: (payload: RegisterPayload) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  invalidateSession: (reason?: AuthUnauthenticatedReason) => void;
  isRefreshingUser: boolean;
  reloadCurrentUser: () => Promise<AuthUser | null>;
  retryAuthBootstrap: () => Promise<AuthUser | null>;
}>;

//===================================================================

type AuthProviderCoreBaseProps = AuthProviderServices &
  Readonly<{
    children: ReactNode;
    bootstrapTimeoutMs?: number;
    revalidateOnFocus?: boolean;
  }>;

export type AuthProviderCoreProps =
  | (AuthProviderCoreBaseProps &
      Readonly<{
        bootstrapMode: 'always';
        sessionHintStorage?: never;
      }>)
  | (AuthProviderCoreBaseProps &
      Readonly<{
        bootstrapMode: 'session-hint';
        sessionHintStorage?: AuthSessionHintReader;
      }>);
