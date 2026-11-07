import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

// An owner-scoped management read of approved reviews. Authorization is
// validated by the API (ownerCatalog=true), not by the presence of this route.
export const GET = createPrivateProxyRoute<{ productId: string }>({
  backendPath: ({ productId }) =>
    `${API_ROUTES.products.managementReviews(productId)}?ownerCatalog=true`,
  method: 'GET',
});
