import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const PATCH = createPrivateProxyRoute<{ requestId: string }>({
  backendPath: ({ requestId }) =>
    API_ROUTES.admin.productRequests.status(requestId),
  method: 'PATCH',
});
