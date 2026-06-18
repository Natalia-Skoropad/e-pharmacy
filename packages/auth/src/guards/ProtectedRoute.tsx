'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '../core/AuthProviderCore';
import { buildLoginRedirectPath } from '../routing/redirects';

//===================================================================

export type ProtectedRouteProps = {
  children: ReactNode;
  loginPath: string;
  loadingFallback?: ReactNode;
  redirectingFallback?: ReactNode;
};

//===================================================================

export function ProtectedRoute({
  children,
  loginPath,
  loadingFallback = null,
  redirectingFallback = null,
}: ProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const { status, isAuthenticated, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady || status === 'error' || isAuthenticated) return;

    const hash = typeof window === 'undefined' ? '' : window.location.hash;
    const currentPath = `${pathname}${queryString ? `?${queryString}` : ''}${hash}`;

    router.replace(buildLoginRedirectPath(currentPath, loginPath));
  }, [isAuthReady, isAuthenticated, loginPath, pathname, queryString, router]);

  if (!isAuthReady || status === 'error') return loadingFallback;
  if (!isAuthenticated) return redirectingFallback;

  return children;
}
