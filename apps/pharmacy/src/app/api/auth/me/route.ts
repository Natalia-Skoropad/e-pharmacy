import { AUTH_PROXY_ROUTES, createPrivateProxyRoute } from '@/lib/api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: AUTH_PROXY_ROUTES.current,
  method: 'GET',
});

//===================================================================

export const PATCH = createPrivateProxyRoute({
  backendPath: AUTH_PROXY_ROUTES.current,
  method: 'PATCH',
});
