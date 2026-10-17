import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute<{ ownerId: string }>({
  backendPath: ({ ownerId }) =>
    API_ROUTES.admin.pharmacyOwners.salesStatistics(ownerId),

  method: 'GET',
});
