import { apiRoutes } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: apiRoutes.admin.accessMe,
  method: 'GET',
});
