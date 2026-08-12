import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type CartPharmacyRouteParams = {
  pharmacyId: string;
};

//===================================================================

export const DELETE = createPrivateProxyRoute<CartPharmacyRouteParams>({
  backendPath: ({ pharmacyId }) => API_ROUTES.cart.pharmacy(pharmacyId),
  method: 'DELETE',
});
