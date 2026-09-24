import { getSafeApplicationRedirectPath } from '@e-pharmacy/auth/routing';

import { ADMIN_ROUTES } from '@/lib/routes';

//===================================================================

const ADMIN_ALLOWED_REDIRECT_PREFIXES = ['/admin'] as const;

//===================================================================

export function resolveAdminLoginDestination(
  requestedRedirect: string | null
): string {
  return getSafeApplicationRedirectPath(requestedRedirect, {
    allowedPrefixes: ADMIN_ALLOWED_REDIRECT_PREFIXES,
    fallbackPath: ADMIN_ROUTES.PROFILE,
  });
}
