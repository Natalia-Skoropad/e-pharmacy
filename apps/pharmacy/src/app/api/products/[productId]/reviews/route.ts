import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPublicGetProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type ReviewsRouteParams = {
  productId: string;
};

//===================================================================

export const GET = createPublicGetProxyRoute<ReviewsRouteParams>({
  backendPath: ({ productId }) => API_ROUTES.products.reviews(productId),
  revalidate: false,
});
