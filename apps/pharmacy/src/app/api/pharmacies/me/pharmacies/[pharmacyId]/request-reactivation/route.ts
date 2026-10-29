import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const POST = createPrivateProxyRoute<{ pharmacyId: string }>({
  backendPath: ({ pharmacyId }) =>
    API_ROUTES.pharmacies.ownedRequestReactivation(pharmacyId),

  method: 'POST',
});
