import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import { createOptionalAuthGetProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type ProductRouteParams = {
  productId: string;
};

//===================================================================

export const GET = createOptionalAuthGetProxyRoute<ProductRouteParams>({
  backendPath: ({ productId }) => API_ROUTES.products.details(productId),
});
