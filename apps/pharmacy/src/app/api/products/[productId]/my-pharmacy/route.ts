import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type ProductMyPharmacyRouteParams = {
  productId: string;
};

//===================================================================

export const POST = createPrivateProxyRoute<ProductMyPharmacyRouteParams>({
  backendPath: ({ productId }) =>
    API_ROUTES.products.addToMyPharmacy(productId),
  method: 'POST',
});

//===================================================================

export const DELETE = createPrivateProxyRoute<ProductMyPharmacyRouteParams>({
  backendPath: ({ productId }) =>
    API_ROUTES.products.removeFromMyPharmacy(productId),
  method: 'DELETE',
});
