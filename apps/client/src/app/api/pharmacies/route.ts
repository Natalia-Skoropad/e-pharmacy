import { createPublicGetProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

export const GET = createPublicGetProxyRoute({
  backendPath: API_ROUTES.pharmacies.list,
});
