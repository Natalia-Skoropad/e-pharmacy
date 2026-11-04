import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

// Only pharmacy locations; must not execute per-row KPI aggregations.
export const GET = createPrivateProxyRoute({
  backendPath: API_ROUTES.admin.pharmacyRegistry.locations,
  method: 'GET',
});
