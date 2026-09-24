import { apiRoutes } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const PATCH = createPrivateProxyRoute({
  backendPath: apiRoutes.admin.employees.myProfile,
  method: 'PATCH',
});
