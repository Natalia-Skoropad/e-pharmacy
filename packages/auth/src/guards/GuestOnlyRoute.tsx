'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import type { AuthUser } from '@e-pharmacy/types/auth';

import { useAuth } from '../core/AuthProviderCore';
import { getSafeLocalRedirectPath } from '../routing/redirects';

import {
  resolveGuardNavigationDestination,
  type TrustedExternalRedirectResolver,
} from './guard-navigation';

import { getGuestGuardDecision } from './guard-state';

//===================================================================

type AuthenticatedRedirectPath =
  | string
  | ((user: AuthUser, requestedRedirect: string | null) => string);

//===================================================================

export type GuestOnlyRouteProps = Readonly<{
  children: ReactNode;
  authenticatedRedirectPath: AuthenticatedRedirectPath;
  loadingFallback?: ReactNode;
  authUnavailableFallback?: ReactNode;
  allowGuestContentWhenUnavailable?: boolean;
  resolveExternalRedirect?: TrustedExternalRedirectResolver;
}>;

//===================================================================

function resolveAuthenticatedRedirectPath(
  authenticatedRedirectPath: AuthenticatedRedirectPath,
  user: AuthUser | null,
  requestedRedirect: string | null
): string {
  if (typeof authenticatedRedirectPath === 'string') {
    return getSafeLocalRedirectPath(
      requestedRedirect,
      authenticatedRedirectPath
    );
  }

  return user ? authenticatedRedirectPath(user, requestedRedirect) : '/';
}

//===================================================================

export function GuestOnlyRoute({
  children,
  authenticatedRedirectPath,
  loadingFallback = null,
  authUnavailableFallback = null,
  allowGuestContentWhenUnavailable = false,
  resolveExternalRedirect,
}: GuestOnlyRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get('redirect');

  const { user, isAuthenticated, isBootstrapping, isUnavailable } = useAuth();

  const decision = getGuestGuardDecision({
    isBootstrapping,
    isUnavailable,
    isAuthenticated,
    allowGuestContentWhenUnavailable,
  });

  useEffect(() => {
    if (decision !== 'redirect-authenticated') return;

    const candidate = resolveAuthenticatedRedirectPath(
      authenticatedRedirectPath,
      user,
      requestedRedirect
    );

    const destination = resolveGuardNavigationDestination({
      candidate,
      resolveExternalRedirect,
    });

    if (destination.type === 'external') {
      window.location.replace(destination.href);
      return;
    }

    router.replace(destination.href);
  }, [
    authenticatedRedirectPath,
    decision,
    requestedRedirect,
    resolveExternalRedirect,
    router,
    user,
  ]);

  if (decision === 'loading') return loadingFallback;
  if (decision === 'unavailable-fallback') return authUnavailableFallback;
  if (decision === 'redirect-authenticated') return null;

  return children;
}
