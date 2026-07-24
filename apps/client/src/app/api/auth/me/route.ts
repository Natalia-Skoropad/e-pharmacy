import { authRoutes } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: authRoutes.current,
  method: 'GET',
});

//===================================================================

export const PATCH = createPrivateProxyRoute({
  backendPath: authRoutes.current,
  method: 'PATCH',
});
