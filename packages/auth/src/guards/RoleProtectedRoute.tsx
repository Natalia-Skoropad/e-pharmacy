'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '../core/AuthProviderCore';
import { buildLoginRedirectPath } from '../routing/redirects';

import type { UserRole } from '@e-pharmacy/types';

//===================================================================

export type RoleProtectedRouteProps = {
  children: ReactNode;
  allowedRoles: readonly UserRole[];
  loginPath?: string;
  forbiddenPath?: string;
  loadingFallback?: ReactNode;
  redirectingFallback?: ReactNode;
  forbiddenFallback?: ReactNode;
};

//===================================================================

export function RoleProtectedRoute({
  children,
  allowedRoles,
  loginPath = '/login',
  forbiddenPath = '/',
  loadingFallback = null,
  redirectingFallback = null,
  forbiddenFallback = null,
}: RoleProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { status, isAuthenticated, isAuthReady, user } = useAuth();
  const hasAllowedRole = Boolean(user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (!isAuthReady || status === 'error') return;

    if (!isAuthenticated) {
      const queryString = searchParams.toString();
      const currentPath = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(buildLoginRedirectPath(currentPath, loginPath));
      return;
    }

    if (!hasAllowedRole) {
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
    router,
    searchParams,
  ]);

  if (!isAuthReady || status === 'error') return loadingFallback;
  if (!isAuthenticated) return redirectingFallback;
  if (!hasAllowedRole) return forbiddenFallback;

  return children;
}
