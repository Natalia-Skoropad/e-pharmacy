'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '../core/AuthProviderCore';
import { getSafeRedirectPath } from '../routing/redirects';

import type { AuthUser } from '@e-pharmacy/types';

//===================================================================

export type AuthenticatedRedirectPath = string | ((user: AuthUser) => string);

export type GuestOnlyRouteProps = {
  children: ReactNode;
  authenticatedRedirectPath?: AuthenticatedRedirectPath;
  loadingFallback?: ReactNode;
};

//===================================================================

function resolveAuthenticatedRedirectPath(
  authenticatedRedirectPath: AuthenticatedRedirectPath,
  user: AuthUser | null
): string {
  if (typeof authenticatedRedirectPath === 'string') {
    return authenticatedRedirectPath;
  }

  return user ? authenticatedRedirectPath(user) : '/';
}

//===================================================================

export function GuestOnlyRoute({
  children,
  authenticatedRedirectPath = '/',
  loadingFallback = null,
}: GuestOnlyRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, isAuthenticated, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) return;

    const fallbackRedirectPath = resolveAuthenticatedRedirectPath(
      authenticatedRedirectPath,
      user
    );
    const redirectTo = getSafeRedirectPath(
      searchParams.get('redirect'),
      fallbackRedirectPath
    );

    router.replace(redirectTo);
  }, [
    authenticatedRedirectPath,
    isAuthReady,
    isAuthenticated,
    router,
    searchParams,
    user,
  ]);

  if (!isAuthReady) return loadingFallback;

  if (isAuthenticated) return null;

  return children;
}
