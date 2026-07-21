import { NextResponse, type NextRequest } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

import { ROUTES } from '@/lib/routes';

//===================================================================

const PROTECTED_ROUTE_PREFIXES = [
  ROUTES.CART,
  ROUTES.CHECKOUT,
  ROUTES.PROFILE,
] as const;

//===================================================================

function isRouteMatch(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

//===================================================================

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((route) =>
    isRouteMatch(pathname, route)
  );
}

//===================================================================

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isProtectedRoute(pathname) && !hasServerAuthCookie(request)) {
    return createLoginRedirect(request);
  }

  // Guest-only pages are intentionally not redirected here. Cookie presence
  // does not reveal the account role, so the client auth guard resolves the
  // correct destination after loading the current user.
  return NextResponse.next();
}

//===================================================================

export const config = {
  matcher: ['/cart/:path*', '/checkout/:path*', '/profile/:path*'],
};
