'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '../core/AuthProviderCore';
import { getSafeRedirectPath } from '../routing/redirects';

import type { AuthUser } from '@e-pharmacy/types';

//===================================================================

export type AuthenticatedRedirectPath =
  | string
  | ((user: AuthUser, requestedRedirect: string | null) => string);

export type GuestOnlyRouteProps = {
  children: ReactNode;
  authenticatedRedirectPath: AuthenticatedRedirectPath;
  loadingFallback?: ReactNode;
};

//===================================================================

function resolveAuthenticatedRedirectPath(
  authenticatedRedirectPath: AuthenticatedRedirectPath,
  user: AuthUser | null,
  requestedRedirect: string | null
): string {
  if (typeof authenticatedRedirectPath === 'string') {
    return authenticatedRedirectPath;
  }

  return user ? authenticatedRedirectPath(user, requestedRedirect) : '/';
}

//===================================================================

export function GuestOnlyRoute({
  children,
  authenticatedRedirectPath,
  loadingFallback = null,
}: GuestOnlyRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get('redirect');

  const { user, status, isAuthenticated, isAuthReady } = useAuth();
  const isAuthUnavailable = status === 'auth_unavailable';

  useEffect(() => {
    if (!isAuthReady || isAuthUnavailable || !isAuthenticated) return;

    const fallbackRedirectPath = resolveAuthenticatedRedirectPath(
      authenticatedRedirectPath,
      user,
      requestedRedirect
    );
    const redirectTo =
      typeof authenticatedRedirectPath === 'function'
        ? getSafeRedirectPath(fallbackRedirectPath)
        : getSafeRedirectPath(requestedRedirect, fallbackRedirectPath);

    router.replace(redirectTo);
  }, [
    authenticatedRedirectPath,
    isAuthReady,
    isAuthUnavailable,
    isAuthenticated,
    router,
    requestedRedirect,
    user,
  ]);

  if (!isAuthReady) return loadingFallback;
  if (isAuthUnavailable) return children;
  if (isAuthenticated) return null;

  return children;
}
