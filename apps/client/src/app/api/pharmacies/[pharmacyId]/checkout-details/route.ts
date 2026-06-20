import { createPrivateProxyRoute } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type PharmacyCheckoutDetailsRouteParams = {
  pharmacyId: string;
};

//===================================================================

export const GET = createPrivateProxyRoute<PharmacyCheckoutDetailsRouteParams>({
  backendPath: ({ pharmacyId }) => API_ROUTES.pharmacies.checkoutDetails(pharmacyId),
  method: 'GET',
});
