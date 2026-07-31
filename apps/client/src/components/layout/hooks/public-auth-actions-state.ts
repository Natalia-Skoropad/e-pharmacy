import type { AuthContextValue } from '@e-pharmacy/auth/react';
import type { AuthUser } from '@e-pharmacy/types/auth';

//===================================================================

type PublicAuthActionsSource = Pick<
  AuthContextValue,
  'user' | 'status' | 'logout' | 'retryAuthBootstrap'
>;

//===================================================================

type AuthenticatedPublicAuthActionsState = Readonly<{
  user: AuthUser;
  logout: AuthContextValue['logout'];
}>;

//===================================================================

export type PublicAuthActionsState =
  | Readonly<{ mode: 'loading' }>
  | Readonly<{
      mode: 'unavailable';
      retryAuthBootstrap: AuthContextValue['retryAuthBootstrap'];
    }>
  | Readonly<{ mode: 'guest' }>
  | (AuthenticatedPublicAuthActionsState &
      Readonly<{ mode: 'authenticated-client' }>)
  | (AuthenticatedPublicAuthActionsState &
      Readonly<{ mode: 'authenticated-pharmacy' }>)
  | (AuthenticatedPublicAuthActionsState &
      Readonly<{ mode: 'authenticated-admin' }>)
  | (AuthenticatedPublicAuthActionsState &
      Readonly<{ mode: 'blocked-account' }>)
  | (AuthenticatedPublicAuthActionsState &
      Readonly<{ mode: 'authenticated-unsupported' }>);

//===================================================================

export function selectPublicAuthActionsState(
  auth: PublicAuthActionsSource
): PublicAuthActionsState {
  if (auth.status === 'bootstrapping') return { mode: 'loading' };

  if (auth.status === 'unavailable') {
    return {
      mode: 'unavailable',
      retryAuthBootstrap: auth.retryAuthBootstrap,
    };
  }

  if (auth.status === 'unauthenticated' || !auth.user) {
    return { mode: 'guest' };
  }

  const authenticatedState = {
    user: auth.user,
    logout: auth.logout,
  } as const;

  if (auth.user.status === 'blocked') {
    return { ...authenticatedState, mode: 'blocked-account' };
  }

  if (auth.user.role === 'client') {
    return { ...authenticatedState, mode: 'authenticated-client' };
  }

  if (auth.user.role === 'pharmacy') {
    return { ...authenticatedState, mode: 'authenticated-pharmacy' };
  }

  if (auth.user.role === 'admin') {
    return { ...authenticatedState, mode: 'authenticated-admin' };
  }

  return { ...authenticatedState, mode: 'authenticated-unsupported' };
}
