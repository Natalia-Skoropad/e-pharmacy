import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type PharmacyCheckoutDetailsRouteParams = {
  pharmacyId: string;
};

//===================================================================

export const GET = createPrivateProxyRoute<PharmacyCheckoutDetailsRouteParams>({
  backendPath: ({ pharmacyId }) =>
    API_ROUTES.pharmacies.checkoutDetails(pharmacyId),
  method: 'GET',
});
