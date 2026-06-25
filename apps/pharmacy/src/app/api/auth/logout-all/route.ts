import { AUTH_PROXY_ROUTES, createAuthProxyRoute } from '@/lib/api/proxy';

//===================================================================

export const POST = createAuthProxyRoute({
  backendPath: AUTH_PROXY_ROUTES.logoutAll,
  markerAction: 'delete',
});
