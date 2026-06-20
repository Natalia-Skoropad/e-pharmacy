import { AUTH_PROXY_ROUTES, createPrivateProxyRoute } from '@/lib/api/proxy';

//===================================================================

export const PATCH = createPrivateProxyRoute({
  backendPath: AUTH_PROXY_ROUTES.password,
  method: 'PATCH',
});
