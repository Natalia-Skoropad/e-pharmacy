import { NextResponse } from 'next/server';

//===================================================================

/**
 * Pharmacy access is resolved by PharmacyProtectedRoute after auth bootstrap.
 *
 * Do not redirect from this proxy to the client app on another origin. Next.js
 * navigation can request an RSC payload here, and a cross-origin middleware
 * redirect turns that request into a failed CORS preflight before the browser
 * can perform a normal document navigation.
 */
export function proxy() {
  return NextResponse.next();
}

//===================================================================

export const config = {
  matcher: ['/pharmacy/:path*'],
};
