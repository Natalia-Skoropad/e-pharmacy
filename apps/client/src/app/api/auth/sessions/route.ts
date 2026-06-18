import { type NextRequest } from 'next/server';

import {
  AUTH_PROXY_ROUTES,
  proxyBackendRequest,
} from '@/lib/api/proxy';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyBackendRequest({
    request,
    backendPath: AUTH_PROXY_ROUTES.sessions,
    method: 'GET',
  });
}
