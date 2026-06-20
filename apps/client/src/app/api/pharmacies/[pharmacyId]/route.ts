import { createOptionalAuthGetProxyRoute } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type PharmacyRouteParams = {
  pharmacyId: string;
};

//===================================================================

export const GET = createOptionalAuthGetProxyRoute<PharmacyRouteParams>({
  backendPath: ({ pharmacyId }) => API_ROUTES.pharmacies.details(pharmacyId),
});
