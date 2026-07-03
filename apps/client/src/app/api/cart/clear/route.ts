import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

export const DELETE = createPrivateProxyRoute({
  backendPath: API_ROUTES.cart.clear,
  method: 'DELETE',
});
