import { authRoutes } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type AuthSessionRouteParams = {
  sessionId: string;
};

//===================================================================

export const DELETE = createPrivateProxyRoute<AuthSessionRouteParams>({
  backendPath: ({ sessionId }) => authRoutes.session(sessionId),
  method: 'DELETE',
});
