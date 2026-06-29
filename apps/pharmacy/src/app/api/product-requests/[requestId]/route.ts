import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import { createPrivateProxyRoute } from '@/lib/api/proxy';

//===================================================================

type ProductRequestRouteParams = {
  requestId: string;
};

//===================================================================

export const GET = createPrivateProxyRoute<ProductRequestRouteParams>({
  backendPath: ({ requestId }) => API_ROUTES.productRequests.details(requestId),
  method: 'GET',
});
