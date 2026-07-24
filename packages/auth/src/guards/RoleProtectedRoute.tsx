'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import type { UserRole } from '@e-pharmacy/types/auth';

import { useAuth } from '../core/AuthProviderCore';
import { buildLoginRedirectPath } from '../routing/redirects';

//===================================================================

export type RoleProtectedRouteProps = {
  children: ReactNode;
  allowedRoles: readonly UserRole[];
  loginPath: string;
  forbiddenPath?: string;
  loadingFallback?: ReactNode;
  redirectingFallback?: ReactNode;
  forbiddenFallback?: ReactNode;
};

//===================================================================

export function RoleProtectedRoute({
  children,
  allowedRoles,
  loginPath,
  forbiddenPath = '/',
  loadingFallback = null,
  redirectingFallback = null,
  forbiddenFallback = null,
}: RoleProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const { status, isAuthenticated, isAuthReady, user } = useAuth();
  const hasAllowedRole = Boolean(user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (!isAuthReady || status === 'auth_unavailable') return;

    if (!isAuthenticated) {
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const currentPath = `${pathname}${queryString ? `?${queryString}` : ''}${hash}`;

      router.replace(buildLoginRedirectPath(currentPath, loginPath));
      return;
    }

    if (!hasAllowedRole) {
      if (/^https?:\/\//i.test(forbiddenPath)) {
        window.location.replace(forbiddenPath);
        return;
      }

      router.replace(forbiddenPath);
    }
  }, [
    forbiddenPath,
    hasAllowedRole,
    isAuthReady,
    isAuthenticated,
    status,
    loginPath,
    pathname,
    queryString,
    router,
  ]);

  if (!isAuthReady || status === 'auth_unavailable') return loadingFallback;
  if (!isAuthenticated) return redirectingFallback;
  if (!hasAllowedRole) return forbiddenFallback;

  return children;
}
