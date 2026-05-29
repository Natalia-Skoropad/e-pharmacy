import { NextResponse, type NextRequest } from 'next/server';

import { AUTH_READY_COOKIE_NAME } from '@/lib/auth/auth-session';
import { ROUTES } from '@/lib/constants/routes';

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

function hasAuthSessionMarker(request: NextRequest): boolean {
  return request.cookies.get(AUTH_READY_COOKIE_NAME)?.value === '1';
}

//===================================================================

function getCurrentPath(request: NextRequest): string {
  const { pathname, search } = request.nextUrl;

  return `${pathname}${search}`;
}

//===================================================================

function getSafeRedirectPath(
  redirectPath: string | null,
  fallbackPath = DEFAULT_AUTHENTICATED_REDIRECT_PATH
): string {
  if (
    !redirectPath ||
    !redirectPath.startsWith('/') ||
    redirectPath.startsWith('//')
  ) {
    return fallbackPath;
  }

  return redirectPath;
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
    request.nextUrl.searchParams.get('redirect')
  );

  return NextResponse.redirect(new URL(redirectPath, request.url));
}

//===================================================================

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasAuthSessionMarker(request);

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    return createLoginRedirect(request);
  }

  if (isGuestOnlyRoute(pathname) && isAuthenticated) {
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
