import { createOptionalAuthGetProxyRoute } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type ProductRouteParams = {
  productId: string;
};

//===================================================================

export const GET = createOptionalAuthGetProxyRoute<ProductRouteParams>({
  backendPath: ({ productId }) => API_ROUTES.products.details(productId),
});
