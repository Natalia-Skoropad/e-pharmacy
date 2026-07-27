'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import type { AuthUser } from '@e-pharmacy/types/auth';

import { useAuth } from '../core/AuthProviderCore';
import { getSafeRedirectPath } from '../routing/redirects';

//===================================================================

type AuthenticatedRedirectPath =
  | string
  | ((user: AuthUser, requestedRedirect: string | null) => string);

export type GuestOnlyRouteProps = {
  children: ReactNode;
  authenticatedRedirectPath: AuthenticatedRedirectPath;
  loadingFallback?: ReactNode;
  authUnavailableFallback?: ReactNode;
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
  authUnavailableFallback = children,
}: GuestOnlyRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get('redirect');

  const { user, isAuthenticated, isBootstrapping, isUnavailable } = useAuth();

  useEffect(() => {
    if (isBootstrapping || isUnavailable || !isAuthenticated) return;

    const fallbackRedirectPath = resolveAuthenticatedRedirectPath(
      authenticatedRedirectPath,
      user,
      requestedRedirect
    );

    if (
      typeof authenticatedRedirectPath === 'function' &&
      /^https?:\/\//i.test(fallbackRedirectPath)
    ) {
      window.location.replace(fallbackRedirectPath);
      return;
    }

    const redirectTo =
      typeof authenticatedRedirectPath === 'function'
        ? getSafeRedirectPath(fallbackRedirectPath)
        : getSafeRedirectPath(requestedRedirect, fallbackRedirectPath);

    router.replace(redirectTo);
  }, [
    authenticatedRedirectPath,
    isAuthenticated,
    isBootstrapping,
    isUnavailable,
    router,
    requestedRedirect,
    user,
  ]);

  if (isBootstrapping) return loadingFallback;
  if (isUnavailable) return authUnavailableFallback;
  if (isAuthenticated) return null;

  return children;
}
