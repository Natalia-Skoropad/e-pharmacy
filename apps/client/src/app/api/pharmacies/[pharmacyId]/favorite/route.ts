import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type PharmacyFavoriteRouteParams = {
  pharmacyId: string;
};

//===================================================================

export const PUT = createPrivateProxyRoute<PharmacyFavoriteRouteParams>({
  backendPath: ({ pharmacyId }) => API_ROUTES.pharmacies.favorite(pharmacyId),
  method: 'PUT',
});

//===================================================================

export const DELETE = createPrivateProxyRoute<PharmacyFavoriteRouteParams>({
  backendPath: ({ pharmacyId }) => API_ROUTES.pharmacies.favorite(pharmacyId),
  method: 'DELETE',
});
