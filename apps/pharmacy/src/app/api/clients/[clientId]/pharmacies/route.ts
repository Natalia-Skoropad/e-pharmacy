import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute<{ clientId: string }>({
  backendPath: ({ clientId }) => API_ROUTES.clients.pharmacies(clientId),
  method: 'GET',
});
