import { NextResponse, type NextRequest } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_READY_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';

//===================================================================

const SHARED_LOGIN_PATH = '/login';
const PROTECTED_PHARMACY_PREFIX = '/pharmacy';

//===================================================================

function getClientAppUrl(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_CLIENT_APP_URL?.trim() ||
    process.env.CLIENT_APP_URL?.trim() ||
    new URL('http://localhost:3000', request.url).toString()
  );
}

//===================================================================

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value ||
      request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value ||
      request.cookies.get(LEGACY_AUTH_COOKIE_NAME)?.value ||
      request.cookies.get(AUTH_READY_COOKIE_NAME)?.value
  );
}

//===================================================================

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = new URL(SHARED_LOGIN_PATH, getClientAppUrl(request));
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const pharmacyAppUrl = new URL(request.url).origin;
  const redirectUrl = new URL(
    requestedPath || getPharmacyDashboardPath(),
    pharmacyAppUrl
  );

  loginUrl.searchParams.set('redirect', redirectUrl.toString());
  return loginUrl;
}

//===================================================================

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(PROTECTED_PHARMACY_PREFIX)) {
    return NextResponse.next();
  }

  if (!hasSessionCookie(request)) {
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  return NextResponse.next();
}

//===================================================================

export const config = {
  matcher: ['/pharmacy/:path*'],
};
