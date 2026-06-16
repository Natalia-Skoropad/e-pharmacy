import { type NextRequest } from 'next/server';

import {
  AUTH_PROXY_ROUTES,
  proxyBackendRequest,
} from '@e-pharmacy/api-client/proxy';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyBackendRequest({
    request,
    backendPath: AUTH_PROXY_ROUTES.sessions,
    method: 'GET',
  });
}
