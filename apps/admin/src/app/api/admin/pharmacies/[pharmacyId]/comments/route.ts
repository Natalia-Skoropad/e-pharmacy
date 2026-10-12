import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type PharmacyParams = { pharmacyId: string };

//===================================================================

const backendPath = ({ pharmacyId }: PharmacyParams) =>
  API_ROUTES.admin.pharmacyComments.list(pharmacyId);

//===================================================================

export const GET = createPrivateProxyRoute<PharmacyParams>({
  backendPath,
  method: 'GET',
});

//===================================================================

export const POST = createPrivateProxyRoute<PharmacyParams>({
  backendPath,
  method: 'POST',
});
