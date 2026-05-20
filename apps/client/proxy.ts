import { NextResponse, type NextRequest } from 'next/server';

//===================================================================

const BACKEND_AUTH_COOKIE_NAME = 'e_pharmacy_auth_token';
const AUTH_READY_COOKIE_NAME = 'e_pharmacy_auth_ready';
const LOGIN_PATH = '/login';
const PRIVATE_PATHS = ['/cart', '/checkout', '/profile'];

//===================================================================

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

//===================================================================

function hasAuthSession(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(BACKEND_AUTH_COOKIE_NAME)?.value ||
      request.cookies.get(AUTH_READY_COOKIE_NAME)?.value
  );
}

//===================================================================

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isPrivatePath(pathname)) {
    return NextResponse.next();
  }

  if (hasAuthSession(request)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.searchParams.set('redirect', `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

//===================================================================

export const config = {
  matcher: ['/cart/:path*', '/checkout/:path*', '/profile/:path*'],
};
