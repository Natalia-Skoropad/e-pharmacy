import { NextResponse, type NextRequest } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@/lib/auth/auth-session';

import { ROUTES, getSafeRedirectPath } from '@e-pharmacy/config/routes';

//===================================================================

const PROTECTED_ROUTE_PREFIXES = [
  ROUTES.CART,
  ROUTES.CHECKOUT,
  ROUTES.PROFILE,
] as const;

const GUEST_ONLY_ROUTE_PREFIXES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.PASSWORD_RECOVERY,
  ROUTES.RESET_PASSWORD,
] as const;

const DEFAULT_AUTHENTICATED_REDIRECT_PATH = ROUTES.PROFILE;

//===================================================================

function isRouteMatch(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((route) =>
    isRouteMatch(pathname, route)
  );
}

function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ONLY_ROUTE_PREFIXES.some((route) =>
    isRouteMatch(pathname, route)
  );
}

function hasServerAuthCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value ||
    request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value
  );
}

//===================================================================

function getCurrentPath(request: NextRequest): string {
  const { pathname, search } = request.nextUrl;

  return `${pathname}${search}`;
}

//===================================================================

function createLoginRedirect(request: NextRequest): NextResponse {
  const redirectUrl = new URL(ROUTES.LOGIN, request.url);

  redirectUrl.searchParams.set('redirect', getCurrentPath(request));

  return NextResponse.redirect(redirectUrl);
}

//===================================================================

function createAuthenticatedRedirect(request: NextRequest): NextResponse {
  const redirectPath = getSafeRedirectPath(
    request.nextUrl.searchParams.get('redirect'),
    DEFAULT_AUTHENTICATED_REDIRECT_PATH
  );

  return NextResponse.redirect(new URL(redirectPath, request.url));
}

//===================================================================

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = hasServerAuthCookie(request);

  if (isProtectedRoute(pathname) && !hasAuthCookie) {
    return createLoginRedirect(request);
  }

  if (isGuestOnlyRoute(pathname) && hasAuthCookie) {
    return createAuthenticatedRedirect(request);
  }

  return NextResponse.next();
}

//===================================================================

export const config = {
  matcher: [
    '/cart/:path*',
    '/checkout/:path*',
    '/profile/:path*',
    '/login',
    '/register',
    '/password-recovery',
    '/reset-password',
  ],
};
