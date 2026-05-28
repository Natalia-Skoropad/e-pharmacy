import { NextResponse, type NextRequest } from 'next/server';

//===================================================================

const BACKEND_AUTH_COOKIE_NAME = 'e_pharmacy_auth_token';
const LOGIN_PATH = '/login';
const PRIVATE_PATHS = ['/cart', '/checkout', '/profile'];

//===================================================================

const LOCAL_SITE_URL = 'http://localhost:3000';
const LOCAL_API_BASE_URL = 'http://localhost:4000';
const PRODUCTION_SITE_URL = 'https://e-pharmacy-client-ten.vercel.app';
const PRODUCTION_API_BASE_URL = 'https://e-pharmacy-api-pbaz.onrender.com';

//===================================================================

const isProduction = process.env.NODE_ENV === 'production';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (isProduction ? PRODUCTION_SITE_URL : LOCAL_SITE_URL);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (isProduction ? PRODUCTION_API_BASE_URL : LOCAL_API_BASE_URL);

//===================================================================

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

//===================================================================

function getHostname(value?: string | null): string | null {
  if (!value) return null;

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

//===================================================================

function canReadBackendAuthCookie(request: NextRequest): boolean {
  const clientHost = getHostname(SITE_URL) ?? request.nextUrl.hostname;
  const apiHost = getHostname(API_BASE_URL);

  // With separate deployment domains, for example Vercel client + Render API,
  // the API httpOnly cookie belongs to the API host and is not available to
  // Next proxy on the client host. In that setup the real auth check happens
  // through getCurrentUser() on the client, not through this proxy.
  return Boolean(apiHost && apiHost === clientHost);
}

//===================================================================

function hasBackendAuthSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get(BACKEND_AUTH_COOKIE_NAME)?.value);
}

//===================================================================

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isPrivatePath(pathname)) {
    return NextResponse.next();
  }

  if (!canReadBackendAuthCookie(request)) {
    return NextResponse.next();
  }

  if (hasBackendAuthSession(request)) {
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
