import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

// Backend permission guards: pharmacies.moderate.
type Params = { pharmacyId: string };

//===================================================================

export const POST = createPrivateProxyRoute<Params>({
  backendPath: ({ pharmacyId }) =>
    API_ROUTES.admin.pharmacyDetail.corrections(pharmacyId),

  method: 'POST',
});
