import { createPrivateProxyRoute } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: API_ROUTES.cart.current,
  method: 'GET',
});
