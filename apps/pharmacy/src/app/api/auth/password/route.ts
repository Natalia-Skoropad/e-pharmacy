import { AUTH_PROXY_ROUTES, createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const PATCH = createPrivateProxyRoute({
  backendPath: AUTH_PROXY_ROUTES.password,
  method: 'PATCH',
  clearAuthCookiesOnSuccess: true,
});
