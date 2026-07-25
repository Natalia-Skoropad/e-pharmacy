import { createPublicGetPrivatePostProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

const reviewsRoute = createPublicGetPrivatePostProxyRoute<{
  productId: string;
}>({
  revalidate: false,
  backendPath: ({ productId }) => API_ROUTES.products.reviews(productId),
});

//===================================================================

export const GET = reviewsRoute.GET;
export const POST = reviewsRoute.POST;
