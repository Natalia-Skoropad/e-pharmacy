import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import { createOptionalAuthGetProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createOptionalAuthGetProxyRoute({
  backendPath: API_ROUTES.products.list,
});
