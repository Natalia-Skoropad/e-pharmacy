'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '../core/AuthProviderCore';
import { buildLoginRedirectPath } from '../routing/redirects';

//===================================================================

export type ProtectedRouteProps = {
  children: ReactNode;
  loginPath?: string;
  loadingFallback?: ReactNode;
  redirectingFallback?: ReactNode;
};

//===================================================================

export function ProtectedRoute({
  children,
  loginPath = '/login',
  loadingFallback = null,
  redirectingFallback = null,
}: ProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { status, isAuthenticated, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady || status === 'error' || isAuthenticated) return;

    const queryString = searchParams.toString();
    const currentPath = queryString ? `${pathname}?${queryString}` : pathname;

    router.replace(buildLoginRedirectPath(currentPath, loginPath));
  }, [isAuthReady, isAuthenticated, loginPath, pathname, router, searchParams]);

  if (!isAuthReady || status === 'error') return loadingFallback;
  if (!isAuthenticated) return redirectingFallback;

  return children;
}
