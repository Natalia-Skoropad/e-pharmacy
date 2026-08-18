import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type ProductRouteParams = {
  productId: string;
};

//===================================================================

export const GET = createPrivateProxyRoute<ProductRouteParams>({
  backendPath: ({ productId }) =>
    API_ROUTES.products.managementDetails(productId),
  method: 'GET',
});
