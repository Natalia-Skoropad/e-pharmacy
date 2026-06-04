'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '../core/AuthProviderCore';
import { getSafeRedirectPath } from '../routing/redirects';

//===================================================================

export type GuestOnlyRouteProps = {
  children: ReactNode;
  authenticatedRedirectPath?: string;
  loadingFallback?: ReactNode;
};

//===================================================================

export function GuestOnlyRoute({
  children,
  authenticatedRedirectPath = '/',
  loadingFallback = null,
}: GuestOnlyRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isAuthenticated, isAuthReady } = useAuth();

  const redirectTo = getSafeRedirectPath(
    searchParams.get('redirect'),
    authenticatedRedirectPath
  );

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) return;

    router.replace(redirectTo);
  }, [isAuthReady, isAuthenticated, redirectTo, router]);

  if (!isAuthReady) return loadingFallback;

  if (isAuthenticated) return null;

  return children;
}
