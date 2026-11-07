import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPublicGetProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

// The pharmacy cabinet displays Admin-managed category icons. Do not serve
// stale category metadata after an administrator edits an icon.
export const GET = createPublicGetProxyRoute({
  revalidate: 0,
  staleWhileRevalidate: 0,
  backendPath: API_ROUTES.productCategories.list,
});
