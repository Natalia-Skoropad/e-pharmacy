import { createPublicGetPrivatePostProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

const reviewsRoute = createPublicGetPrivatePostProxyRoute<{
  pharmacyId: string;
}>({
  backendPath: ({ pharmacyId }) => API_ROUTES.pharmacies.reviews(pharmacyId),
});

//===================================================================

export const GET = reviewsRoute.GET;
export const POST = reviewsRoute.POST;
