import { createPublicGetProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

export const GET = createPublicGetProxyRoute({
  revalidate: 600,
  staleWhileRevalidate: 600,
  backendPath: API_ROUTES.pharmacies.filters,
});
