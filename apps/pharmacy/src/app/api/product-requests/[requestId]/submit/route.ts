import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const POST = createPrivateProxyRoute<{ requestId: string }>({
  backendPath: ({ requestId }) => API_ROUTES.productRequests.submit(requestId),
  method: 'POST',
});
