import { getSafeRedirectPath } from '@e-pharmacy/auth/routing';
import { ROUTES, CLIENT_RESERVED_APP_PREFIXES } from '@/lib/routes';

import type { AuthUser } from '@e-pharmacy/types';

//===================================================================

const RESERVED_APPLICATION_PREFIXES = CLIENT_RESERVED_APP_PREFIXES.map(
  (prefix) => `/${prefix}`
);

//===================================================================

function isClientApplicationPath(path: string): boolean {
  return !RESERVED_APPLICATION_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

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

  const safeRedirect = getSafeRedirectPath(requestedRedirect, ROUTES.PROFILE);

  return isClientApplicationPath(safeRedirect) ? safeRedirect : ROUTES.PROFILE;
}

//===================================================================

export function resolveAuthenticatedRouteForClientApp(
  user: AuthUser,
  requestedRedirect: string | null
): string {
  return resolveLoginDestination({ user, requestedRedirect });
}
