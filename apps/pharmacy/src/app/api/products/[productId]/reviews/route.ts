import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import { createOptionalAuthGetProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type ProductReviewsRouteParams = {
  productId: string;
};

//===================================================================

export const GET = createOptionalAuthGetProxyRoute<ProductReviewsRouteParams>({
  backendPath: ({ productId }) => API_ROUTES.products.reviews(productId),
});
