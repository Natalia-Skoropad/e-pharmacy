import { type NextRequest } from 'next/server';

import { AUTH_PROXY_ROUTES, proxyAuthRequest } from '@e-pharmacy/api-client/proxy';

//===================================================================

export async function POST(request: NextRequest) {
  return proxyAuthRequest({
    request,
    backendPath: AUTH_PROXY_ROUTES.register,
    markerAction: 'set',
  });
}
