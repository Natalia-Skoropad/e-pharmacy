import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute<{ pharmacyId: string }>({
  backendPath: ({ pharmacyId }) =>
    API_ROUTES.pharmacies.ownedSalesStatistics(pharmacyId),

  method: 'GET',
});
