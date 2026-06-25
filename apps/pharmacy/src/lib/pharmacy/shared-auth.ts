import { getPharmacyDashboardPath } from './routes';

//===================================================================

const SHARED_LOGIN_PATH = '/login';
const CLIENT_APP_FALLBACK_URL = 'http://localhost:3000';

//===================================================================

function getClientAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CLIENT_APP_URL?.trim() || CLIENT_APP_FALLBACK_URL
  );
}

//===================================================================

export function getSharedLoginUrl(redirect?: string): string {
  const loginUrl = new URL(SHARED_LOGIN_PATH, getClientAppUrl());

  if (redirect) {
    loginUrl.searchParams.set('redirect', redirect);
  }

  return loginUrl.toString();
}

//===================================================================

export function getSharedLoginUrlForCurrentPharmacyPage(
  currentPath = getPharmacyDashboardPath()
): string {
  if (typeof window === 'undefined') {
    return getSharedLoginUrl(currentPath);
  }

  const redirectUrl = new URL(currentPath, window.location.origin);
  return getSharedLoginUrl(redirectUrl.toString());
}
