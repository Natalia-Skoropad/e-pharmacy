import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import { createPrivateProxyRoute } from '@/lib/api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: API_ROUTES.pharmacies.myProfile,
  method: 'GET',
});

//===================================================================

export const PATCH = createPrivateProxyRoute({
  backendPath: API_ROUTES.pharmacies.myProfile,
  method: 'PATCH',
});
