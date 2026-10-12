import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

// Backend permission guards: pharmacies.view.
type Params = { pharmacyId: string };

//===================================================================

export const GET = createPrivateProxyRoute<Params>({
  backendPath: ({ pharmacyId }) =>
    API_ROUTES.admin.pharmacyDetail.details(pharmacyId),

  method: 'GET',
});
