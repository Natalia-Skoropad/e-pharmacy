import {
  getSafeLocalRedirectPath,
  getTrustedExternalRedirectUrl,
} from '@e-pharmacy/auth/routing';

import { PHARMACY_ROUTES } from '@/lib/routes';

//===================================================================

const SHARED_LOGIN_PATH = '/login';
const CLIENT_APP_FALLBACK_URL = 'http://localhost:3000';

//===================================================================

function getClientAppOrigin(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_CLIENT_APP_URL?.trim() || CLIENT_APP_FALLBACK_URL;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return new URL(CLIENT_APP_FALLBACK_URL).origin;
  }
}

//===================================================================

export function getClientAppHomeUrl(): string {
  return new URL('/', getClientAppOrigin()).toString();
}

//===================================================================

export function getSharedLoginUrl(redirect?: string): string {
  const loginUrl = new URL(SHARED_LOGIN_PATH, getClientAppOrigin());

  if (redirect) {
    loginUrl.searchParams.set('redirect', redirect);
  }

  return (
    getTrustedExternalRedirectUrl(loginUrl.toString(), {
      allowedOrigins: [getClientAppOrigin()],
      allowedPathPrefixes: [SHARED_LOGIN_PATH],
    }) ?? getClientAppHomeUrl()
  );
}

//===================================================================

export function getSharedLoginUrlForCurrentPharmacyPage(
  currentPath: string = PHARMACY_ROUTES.DASHBOARD
): string {
  const safeCurrentPath = getSafeLocalRedirectPath(
    currentPath,
    PHARMACY_ROUTES.DASHBOARD
  );

  if (typeof window === 'undefined') {
    return getSharedLoginUrl(safeCurrentPath);
  }

  const redirectUrl = new URL(safeCurrentPath, window.location.origin);
  return getSharedLoginUrl(redirectUrl.toString());
}
