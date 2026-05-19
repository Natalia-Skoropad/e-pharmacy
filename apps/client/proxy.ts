import { NextResponse, type NextRequest } from 'next/server';

//===================================================================

const AUTH_COOKIE_NAME = 'e_pharmacy_auth_token';
const LOGIN_PATH = '/login';
const PRIVATE_PATHS = ['/cart', '/checkout', '/profile'];

//===================================================================

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

//===================================================================

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isPrivatePath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.searchParams.set('next', `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

//===================================================================

export const config = {
  matcher: ['/cart/:path*', '/checkout/:path*', '/profile/:path*'],
};
