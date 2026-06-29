import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import { createPrivateProxyRoute } from '@/lib/api/proxy';

//===================================================================

type ClientRouteParams = {
  clientId: string;
};

//===================================================================

export const GET = createPrivateProxyRoute<ClientRouteParams>({
  backendPath: ({ clientId }) => API_ROUTES.clients.details(clientId),
  method: 'GET',
});
