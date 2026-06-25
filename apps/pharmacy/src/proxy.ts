import { NextResponse, type NextRequest } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_READY_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';

//===================================================================

const LOGIN_PATH = '/auth/login';
const PROTECTED_PHARMACY_PREFIX = '/pharmacy';

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
  const loginUrl = new URL(LOGIN_PATH, request.url);
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('redirect', requestedPath || getPharmacyDashboardPath());
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
