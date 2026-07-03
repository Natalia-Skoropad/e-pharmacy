import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

export const POST = createPrivateProxyRoute({
  backendPath: API_ROUTES.cart.addItem,
  method: 'POST',
});
