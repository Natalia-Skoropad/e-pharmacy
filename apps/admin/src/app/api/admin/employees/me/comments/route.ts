import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: API_ROUTES.admin.employees.myComments,
  method: 'GET',
});

//===================================================================

export const POST = createPrivateProxyRoute({
  backendPath: API_ROUTES.admin.employees.myComments,
  method: 'POST',
});
