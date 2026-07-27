import {
  getSafeApplicationRedirectPath,
  getTrustedExternalRedirectUrl,
} from '@e-pharmacy/auth/routing';
import type { AuthUser } from '@e-pharmacy/types/auth';

import { ROUTES, CLIENT_ALLOWED_REDIRECT_PREFIXES } from '@/lib/routes';

//===================================================================

const PHARMACY_DASHBOARD_PATH = '/pharmacy/dashboard';
const DEVELOPMENT_PHARMACY_APP_URL = 'http://localhost:3002';

//===================================================================

function getPharmacyAppOrigin(): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_PHARMACY_APP_URL?.trim();
  const candidate =
    configuredUrl ||
    (process.env.NODE_ENV !== 'production'
      ? DEVELOPMENT_PHARMACY_APP_URL
      : null);

  if (!candidate) return null;

  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

//===================================================================

export function getPharmacyDashboardUrl(): string {
  const pharmacyOrigin = getPharmacyAppOrigin();
  return pharmacyOrigin
    ? new URL(PHARMACY_DASHBOARD_PATH, pharmacyOrigin).toString()
    : ROUTES.HOME;
}

//===================================================================

export function resolveTrustedClientAuthExternalRedirect(
  candidate: string
): string | null {
  const pharmacyOrigin = getPharmacyAppOrigin();
  if (!pharmacyOrigin) return null;

  return getTrustedExternalRedirectUrl(candidate, {
    allowedOrigins: [pharmacyOrigin],
    allowedPathPrefixes: ['/pharmacy'],
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
    return getPharmacyDashboardUrl();
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
