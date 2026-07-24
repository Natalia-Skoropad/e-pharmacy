import { authRoutes } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const PATCH = createPrivateProxyRoute({
  backendPath: authRoutes.password,
  method: 'PATCH',
  clearAuthCookiesOnSuccess: true,
});
