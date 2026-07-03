import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: API_ROUTES.products.favorites,
  method: 'GET',
});
