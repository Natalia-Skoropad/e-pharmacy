import { getSafeApplicationRedirectPath } from '@e-pharmacy/auth/routing';
import { ROUTES } from '@/lib/routes';

import type { AuthUser } from '@e-pharmacy/types';

//===================================================================

const CLIENT_ALLOWED_REDIRECT_PREFIXES = [
  ROUTES.HOME,
  ROUTES.PROFILE,
  ROUTES.PHARMACIES,
  ROUTES.PRODUCTS_CATALOG,
  ROUTES.CART,
  ROUTES.CHECKOUT,
  ROUTES.DELIVERY_PAYMENT,
  ROUTES.RETURN_POLICY,
  ROUTES.USER_AGREEMENT,
  ROUTES.PERSONAL_DATA_NOTICE,
] as const;

//===================================================================

export function resolveLoginDestination({
  user,
  requestedRedirect,
}: {
  user: AuthUser;
  requestedRedirect: string | null;
}): string {
  if (user.status !== 'active' || user.role !== 'client') {
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
