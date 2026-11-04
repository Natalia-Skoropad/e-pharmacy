import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateProxyRoute({
  backendPath: API_ROUTES.pharmacies.ownedRegistry,
  // KPI aggregates can exceed the generic 12s private-request budget under
  // load. Give this one read endpoint a bounded independent budget.
  timeoutMs: 28_000,
});
