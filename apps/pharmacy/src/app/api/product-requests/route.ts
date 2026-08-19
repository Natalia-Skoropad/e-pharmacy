import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: API_ROUTES.productRequests.list,
  method: 'GET',
});

//===================================================================

export const POST = createPrivateProxyRoute({
  backendPath: API_ROUTES.productRequests.list,
  method: 'POST',
  bodyPreset: 'documentUpload',
});
