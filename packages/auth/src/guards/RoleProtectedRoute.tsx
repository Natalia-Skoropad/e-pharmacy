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

import { getRoleGuardDecision } from './guard-state';

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

  const { isAuthenticated, isBootstrapping, isUnavailable, user } = useAuth();
  const hasAllowedRole = Boolean(user && allowedRoles.includes(user.role));
  const decision = getRoleGuardDecision({
    isBootstrapping,
    isUnavailable,
    isAuthenticated,
    hasAllowedRole,
  });

  useEffect(() => {
    if (decision === 'redirect-login') {
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const currentPath = buildCurrentLocation({
        pathname,
        queryString,
        hash,
      });

      router.replace(buildLoginRedirectPath(currentPath, loginPath));
      return;
    }

    if (decision === 'forbidden') {
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
    decision,
    loginPath,
    pathname,
    queryString,
    resolveExternalRedirect,
    router,
  ]);

  if (decision === 'loading') return loadingFallback;
  if (decision === 'unavailable') return authUnavailableFallback;
  if (decision === 'redirect-login') return redirectingFallback;
  if (decision === 'forbidden') return forbiddenFallback;

  return children;
}
