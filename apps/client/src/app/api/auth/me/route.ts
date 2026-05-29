import { type NextRequest } from 'next/server';

import { AUTH_PROXY_ROUTES, proxyAuthRequest } from '@/lib/api/auth-proxy';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyAuthRequest({
    request,
    backendPath: AUTH_PROXY_ROUTES.current,
    method: 'GET',
  });
}

//===================================================================

export async function PATCH(request: NextRequest) {
  return proxyAuthRequest({
    request,
    backendPath: AUTH_PROXY_ROUTES.current,
    method: 'PATCH',
  });
}
