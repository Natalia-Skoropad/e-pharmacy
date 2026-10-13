import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

// Permission: pharmacies.view, enforced by Admin API (not the BFF).
type Params = { pharmacyId: string };

//===================================================================

export const GET = createPrivateProxyRoute<Params>({
  backendPath: ({ pharmacyId }) =>
    API_ROUTES.admin.pharmacyDetail.salesStatistics(pharmacyId),
  method: 'GET',
});
