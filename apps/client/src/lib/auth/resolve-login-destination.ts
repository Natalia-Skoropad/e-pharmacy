import {
  getSafeApplicationRedirectPath,
  getTrustedExternalRedirectUrl,
} from '@e-pharmacy/auth/routing';
import type { AuthUser } from '@e-pharmacy/types/auth';

import { ROUTES, CLIENT_ALLOWED_REDIRECT_PREFIXES } from '@/lib/routes';

import {
  getPharmacyAppConfiguration,
  requirePharmacyAppConfiguration,
} from './pharmacy-app-config';

//===================================================================

export function getPharmacyDashboardUrl(): string | null {
  const result = getPharmacyAppConfiguration();
  return result.ok ? result.config.dashboardUrl : null;
}

//===================================================================

export function resolveTrustedClientAuthExternalRedirect(
  candidate: string
): string | null {
  const result = getPharmacyAppConfiguration();
  if (!result.ok) return null;

  return getTrustedExternalRedirectUrl(candidate, {
    allowedOrigins: [result.config.origin],
    allowedPathPrefixes: [result.config.allowedPathPrefix],
  });
}

//===================================================================

export function resolveLoginDestination({
  user,
  requestedRedirect,
}: {
  user: AuthUser;
  requestedRedirect: string | null;
}): string {
  if (user.status !== 'active') {
    return ROUTES.HOME;
  }

  if (user.role === 'pharmacy') {
    return requirePharmacyAppConfiguration().dashboardUrl;
  }

  if (user.role !== 'client') {
    return ROUTES.HOME;
  }

  return getSafeApplicationRedirectPath(requestedRedirect, {
    allowedPrefixes: CLIENT_ALLOWED_REDIRECT_PREFIXES,
    fallbackPath: ROUTES.PROFILE,
  });
}

//===================================================================

export function resolveAuthenticatedRouteForClientApp(
  user: AuthUser,
  requestedRedirect: string | null
): string {
  return resolveLoginDestination({ user, requestedRedirect });
}
