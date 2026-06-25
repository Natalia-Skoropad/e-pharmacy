import { getSafeApplicationRedirectPath } from '@e-pharmacy/auth/routing';
import { ROUTES, CLIENT_ALLOWED_REDIRECT_PREFIXES } from '@/lib/routes';

import type { AuthUser } from '@e-pharmacy/types';

//===================================================================

const PHARMACY_DASHBOARD_PATH = '/pharmacy/dashboard';

//===================================================================

function getPharmacyDashboardUrl(): string {
  const pharmacyAppUrl = process.env.NEXT_PUBLIC_PHARMACY_APP_URL?.trim();

  if (!pharmacyAppUrl) {
    return PHARMACY_DASHBOARD_PATH;
  }

  return new URL(PHARMACY_DASHBOARD_PATH, pharmacyAppUrl).toString();
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
  requestedRedirect: string | null,
): string {
  return resolveLoginDestination({ user, requestedRedirect });
}
