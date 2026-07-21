import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type ProductRequestRouteParams = {
  requestId: string;
};

//===================================================================

export const GET = createPrivateProxyRoute<ProductRequestRouteParams>({
  backendPath: ({ requestId }) => API_ROUTES.productRequests.details(requestId),
  method: 'GET',
});

export const PATCH = createPrivateProxyRoute<ProductRequestRouteParams>({
  backendPath: ({ requestId }) => API_ROUTES.productRequests.details(requestId),
  method: 'PATCH',
});

export const DELETE = createPrivateProxyRoute<ProductRequestRouteParams>({
  backendPath: ({ requestId }) => API_ROUTES.productRequests.details(requestId),
  method: 'DELETE',
});
