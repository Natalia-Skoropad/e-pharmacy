import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute<{ requestId: string }>({
  backendPath: ({ requestId }) =>
    API_ROUTES.admin.productRequests.details(requestId),
  method: 'GET',
});
