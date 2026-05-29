import { type NextRequest } from 'next/server';

import { AUTH_PROXY_ROUTES, proxyAuthRequest } from '@/lib/api/auth-proxy';

//===================================================================

export async function POST(request: NextRequest) {
  return proxyAuthRequest({
    request,
    backendPath: AUTH_PROXY_ROUTES.logout,
    markerAction: 'delete',
  });
}
