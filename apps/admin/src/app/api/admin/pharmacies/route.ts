import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: API_ROUTES.admin.pharmacyRegistry.list,
  method: 'GET',
  // The paginated registry computes several metrics per pharmacy. Keep this
  // read timeout local rather than extending every private API request.
  timeoutMs: 30_000,
});
