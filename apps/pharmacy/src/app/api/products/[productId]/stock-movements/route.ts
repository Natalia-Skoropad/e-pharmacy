import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type ProductStockMovementsRouteParams = {
  productId: string;
};

//===================================================================

export const GET = createPrivateProxyRoute<ProductStockMovementsRouteParams>({
  backendPath: ({ productId }) => API_ROUTES.products.stockMovements(productId),
  method: 'GET',
});
