import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type OwnerRouteParams = { ownerId: string };

//===================================================================

const backendPath = ({ ownerId }: OwnerRouteParams) =>
  API_ROUTES.admin.pharmacyOwners.comments(ownerId);

//===================================================================

export const GET = createPrivateProxyRoute<OwnerRouteParams>({
  backendPath,
  method: 'GET',
});

//===================================================================

export const POST = createPrivateProxyRoute<OwnerRouteParams>({
  backendPath,
  method: 'POST',
});
