import type { AuthUser } from '@e-pharmacy/types/auth';

import type {
  AuthState,
  AuthUnauthenticatedReason,
} from './auth-provider.types';

//===================================================================

export function createBootstrappingAuthState(): AuthState {
  return {
    status: 'bootstrapping',
    user: null,
    error: null,
  };
}

//===================================================================

export function createAuthenticatedAuthState(
  user: AuthUser,
  isRevalidating = false
): AuthState {
  return {
    status: 'authenticated',
    user,
    error: null,
    isRevalidating,
  };
}

//===================================================================

export function createUnauthenticatedAuthState(
  reason?: AuthUnauthenticatedReason
): AuthState {
  return {
    status: 'unauthenticated',
    user: null,
    error: null,
    ...(reason ? { reason } : {}),
  };
}

//===================================================================

export function createUnavailableAuthState(
  error: unknown,
  user: AuthUser | null
): AuthState {
  return {
    status: 'unavailable',
    user,
    error,
  };
}
