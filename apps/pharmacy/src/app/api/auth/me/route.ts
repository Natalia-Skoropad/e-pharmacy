import { AUTH_PROXY_ROUTES, createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: AUTH_PROXY_ROUTES.current,
  method: 'GET',
  clearAuthCookiesOnRefreshFailure: false,
});

//===================================================================

export const PATCH = createPrivateProxyRoute({
  backendPath: AUTH_PROXY_ROUTES.current,
  method: 'PATCH',
});
