import { type NextRequest } from 'next/server';
import {
  AUTH_PROXY_ROUTES,
  proxyBackendRequest,
} from '@e-pharmacy/api-client/proxy';

//===================================================================

type RouteContext = { params: Promise<{ sessionId: string }> };

//===================================================================

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  return proxyBackendRequest({
    request,
    backendPath: AUTH_PROXY_ROUTES.session(sessionId),
    method: 'DELETE',
  });
}
