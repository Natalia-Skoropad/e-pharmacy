import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import { createPrivateProxyRoute } from '@/lib/api/proxy';

//===================================================================

export const POST = createPrivateProxyRoute({
  backendPath: API_ROUTES.pharmacies.sendMyProfileForVerification,
  method: 'POST',
});
