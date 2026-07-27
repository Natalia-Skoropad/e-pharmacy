'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import type { UserRole } from '@e-pharmacy/types/auth';

import { useAuth } from '../core/AuthProviderCore';
import { buildLoginRedirectPath } from '../routing/redirects';

import {
  buildCurrentLocation,
  resolveGuardNavigationDestination,
  type TrustedExternalRedirectResolver,
} from './guard-navigation';

//===================================================================

export type RoleProtectedRouteProps = Readonly<{
  children: ReactNode;
  allowedRoles: readonly UserRole[];
  loginPath: string;
  forbiddenPath?: string;
  loadingFallback?: ReactNode;
  authUnavailableFallback?: ReactNode;
  redirectingFallback?: ReactNode;
  forbiddenFallback?: ReactNode;
  resolveExternalRedirect?: TrustedExternalRedirectResolver;
}>;

//===================================================================

export function RoleProtectedRoute({
  children,
  allowedRoles,
  loginPath,
  forbiddenPath = '/',
  loadingFallback = null,
  authUnavailableFallback = null,
  redirectingFallback = null,
  forbiddenFallback = null,
  resolveExternalRedirect,
}: RoleProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const {
    isAuthenticated,
    isBootstrapping,
    isUnavailable,
    user,
  } = useAuth();
  const hasAllowedRole = Boolean(user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (isBootstrapping || isUnavailable) return;

    if (!isAuthenticated) {
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const currentPath = buildCurrentLocation({
        pathname,
        queryString,
        hash,
      });

      router.replace(buildLoginRedirectPath(currentPath, loginPath));
      return;
    }

    if (!hasAllowedRole) {
      const destination = resolveGuardNavigationDestination({
        candidate: forbiddenPath,
        resolveExternalRedirect,
      });

      if (destination.type === 'external') {
        window.location.replace(destination.href);
        return;
      }

      router.replace(destination.href);
    }
  }, [
    forbiddenPath,
    hasAllowedRole,
    isAuthenticated,
    isBootstrapping,
    isUnavailable,
    loginPath,
    pathname,
    queryString,
    resolveExternalRedirect,
    router,
  ]);

  if (isBootstrapping) return loadingFallback;
  if (isUnavailable) return authUnavailableFallback;
  if (!isAuthenticated) return redirectingFallback;
  if (!hasAllowedRole) return forbiddenFallback;

  return children;
}
