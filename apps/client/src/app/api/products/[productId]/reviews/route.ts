import { createPublicGetPrivatePostProxyRoute } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

const reviewsRoute = createPublicGetPrivatePostProxyRoute<{
  productId: string;
}>({
  backendPath: ({ productId }) => API_ROUTES.products.reviews(productId),
});

//===================================================================

export const GET = reviewsRoute.GET;
export const POST = reviewsRoute.POST;
