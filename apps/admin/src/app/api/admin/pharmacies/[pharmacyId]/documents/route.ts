import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type PharmacyParams = { pharmacyId: string };

//===================================================================

export const GET = createPrivateProxyRoute<PharmacyParams>({
  backendPath: ({ pharmacyId }) =>
    API_ROUTES.admin.pharmacyDocuments.list(pharmacyId),

  method: 'GET',
});
