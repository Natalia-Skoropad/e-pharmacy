import { AUTH_PROXY_ROUTES, createPrivateProxyRoute } from '@/lib/api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: AUTH_PROXY_ROUTES.sessions,
  method: 'GET',
});
