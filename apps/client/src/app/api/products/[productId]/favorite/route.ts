import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type ProductFavoriteRouteParams = {
  productId: string;
};

//===================================================================

export const PUT = createPrivateProxyRoute<ProductFavoriteRouteParams>({
  backendPath: ({ productId }) => API_ROUTES.products.favorite(productId),
  method: 'PUT',
});

//===================================================================

export const DELETE = createPrivateProxyRoute<ProductFavoriteRouteParams>({
  backendPath: ({ productId }) => API_ROUTES.products.favorite(productId),
  method: 'DELETE',
});
