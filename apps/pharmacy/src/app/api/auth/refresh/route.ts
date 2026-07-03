import { AUTH_PROXY_ROUTES, createAuthProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const POST = createAuthProxyRoute({
  backendPath: AUTH_PROXY_ROUTES.refresh,
  markerAction: 'set',
});
