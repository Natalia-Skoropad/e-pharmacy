import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type OwnerRouteParams = { ownerId: string };

//===================================================================

export const GET = createPrivateProxyRoute<OwnerRouteParams>({
  backendPath: ({ ownerId }) =>
    API_ROUTES.admin.pharmacyOwners.activity(ownerId),
  method: 'GET',
});
