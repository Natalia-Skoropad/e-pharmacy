import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type ReviewsRouteParams = {
  productId: string;
};

//===================================================================

export const GET = createPrivateProxyRoute<ReviewsRouteParams>({
  backendPath: ({ productId }) =>
    API_ROUTES.products.managementReviews(productId),
  method: 'GET',
});
