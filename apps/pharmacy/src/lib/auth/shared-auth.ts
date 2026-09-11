import {
  getSafeLocalRedirectPath,
  getTrustedExternalRedirectUrl,
} from '@e-pharmacy/auth/routing';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { requireClientAppConfiguration } from './client-app-config';

//===================================================================

const SHARED_LOGIN_PATH = '/login';

//===================================================================

function getClientAppLoginPath(basePath: string): string {
  return `${basePath}${SHARED_LOGIN_PATH}`;
}

//===================================================================

export function getClientAppHomeUrl(): string {
  return requireClientAppConfiguration().baseUrl;
}

//===================================================================

export function getSharedLoginUrl(redirect?: string): string {
  const clientApp = requireClientAppConfiguration();
  const loginPath = getClientAppLoginPath(clientApp.basePath);
  const loginUrl = new URL(loginPath, clientApp.origin);

  if (redirect) {
    loginUrl.searchParams.set('redirect', redirect);
  }

  return (
    getTrustedExternalRedirectUrl(loginUrl.toString(), {
      allowedOrigins: [clientApp.origin],
      allowedPathPrefixes: [loginPath],
    }) ?? clientApp.baseUrl
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
