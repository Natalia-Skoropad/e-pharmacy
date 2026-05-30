import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/backend-proxy';
import { AUTH_PROXY_ROUTES } from '@/lib/api/auth-proxy';

//===================================================================

export async function PATCH(request: NextRequest) {
  return proxyBackendRequest({
    request,
    backendPath: AUTH_PROXY_ROUTES.password,
    method: 'PATCH',
  });
}
