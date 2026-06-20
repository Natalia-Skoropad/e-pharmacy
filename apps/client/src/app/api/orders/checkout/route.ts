import { createPrivateProxyRoute } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

export const POST = createPrivateProxyRoute({
  backendPath: API_ROUTES.orders.checkout,
  method: 'POST',
});
