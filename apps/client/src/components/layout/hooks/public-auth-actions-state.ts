import type { AuthContextValue } from '@e-pharmacy/auth/react';
import type { AuthUser } from '@e-pharmacy/types/auth';

//===================================================================

type PublicAuthActionsSource = Pick<
  AuthContextValue,
  'user' | 'status' | 'logout' | 'retryAuthBootstrap'
>;

type AuthenticatedPublicAuthActionsState = Readonly<{
  user: AuthUser;
  logout: AuthContextValue['logout'];
}>;

//===================================================================

export type PublicAuthActionsState =
  | Readonly<{
      mode: 'loading';
    }>
  | Readonly<{
      mode: 'unavailable';
      canRetry: true;
      retryAuthBootstrap: AuthContextValue['retryAuthBootstrap'];
    }>
  | Readonly<{
      mode: 'guest';
    }>
  | (AuthenticatedPublicAuthActionsState &
      Readonly<{
        mode: 'authenticated-client';
      }>)
  | (AuthenticatedPublicAuthActionsState &
      Readonly<{
        mode: 'authenticated-pharmacy';
      }>)
  | (AuthenticatedPublicAuthActionsState &
      Readonly<{
        mode: 'authenticated-other';
      }>);

//===================================================================

export function selectPublicAuthActionsState(
  auth: PublicAuthActionsSource
): PublicAuthActionsState {
  if (auth.status === 'bootstrapping') {
    return { mode: 'loading' };
  }

  if (auth.status === 'unavailable') {
    return {
      mode: 'unavailable',
      canRetry: true,
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

  if (auth.user.status === 'active' && auth.user.role === 'client') {
    return {
      ...authenticatedState,
      mode: 'authenticated-client',
    };
  }

  if (auth.user.status === 'active' && auth.user.role === 'pharmacy') {
    return {
      ...authenticatedState,
      mode: 'authenticated-pharmacy',
    };
  }

  return {
    ...authenticatedState,
    mode: 'authenticated-other',
  };
}
