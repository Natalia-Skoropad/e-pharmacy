import { createPublicGetProxyRoute } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

export const GET = createPublicGetProxyRoute({
  backendPath: API_ROUTES.products.list,
});
