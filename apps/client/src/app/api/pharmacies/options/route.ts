import { createPublicGetProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import { PUBLIC_CACHE_REVALIDATE_SECONDS } from '@/lib/api/public-cache-policy';

//===================================================================

export const GET = createPublicGetProxyRoute({
  revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.dictionary,
  staleWhileRevalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.dictionary,
  backendPath: API_ROUTES.pharmacies.options,
});
