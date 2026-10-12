import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

// Backend permission guards: pharmacies.view.
type Params = { pharmacyId: string; auditLogId: string };

//===================================================================

export const GET = createPrivateProxyRoute<Params>({
  backendPath: ({ pharmacyId, auditLogId }) =>
    API_ROUTES.admin.pharmacyActivity.details(pharmacyId, auditLogId),

  method: 'GET',
});
