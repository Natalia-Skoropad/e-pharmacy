import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type ClientProductsRouteParams = {
  clientId: string;
};

//===================================================================

export const GET = createPrivateProxyRoute<ClientProductsRouteParams>({
  backendPath: ({ clientId }) => API_ROUTES.clients.products(clientId),
  method: 'GET',
});
