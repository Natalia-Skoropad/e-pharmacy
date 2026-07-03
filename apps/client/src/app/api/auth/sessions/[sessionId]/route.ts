import { AUTH_PROXY_ROUTES, createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type AuthSessionRouteParams = {
  sessionId: string;
};

//===================================================================

export const DELETE = createPrivateProxyRoute<AuthSessionRouteParams>({
  backendPath: ({ sessionId }) => AUTH_PROXY_ROUTES.session(sessionId),
  method: 'DELETE',
});
