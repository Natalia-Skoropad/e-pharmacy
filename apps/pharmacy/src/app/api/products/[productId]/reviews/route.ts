import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createOptionalAuthGetProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type ReviewsRouteParams = {
  productId: string;
};

//===================================================================

export const GET = createOptionalAuthGetProxyRoute<ReviewsRouteParams>({
  backendPath: ({ productId }) => API_ROUTES.products.reviews(productId),
});
