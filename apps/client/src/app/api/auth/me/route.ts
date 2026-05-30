import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/backend-proxy';
import { AUTH_PROXY_ROUTES } from '@/lib/api/auth-proxy';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyBackendRequest({
    request,
    backendPath: AUTH_PROXY_ROUTES.current,
    method: 'GET',
  });
}

//===================================================================

export async function PATCH(request: NextRequest) {
  return proxyBackendRequest({
    request,
    backendPath: AUTH_PROXY_ROUTES.current,
    method: 'PATCH',
  });
}
