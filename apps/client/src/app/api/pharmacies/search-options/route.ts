import { createPublicGetProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { PUBLIC_CACHE_REVALIDATE_SECONDS } from '@/lib/api/public-cache-policy';

//===================================================================

// The proxy forwards the validated query to the backend; no unbounded lists.
export const GET = createPublicGetProxyRoute({
  backendPath: API_ROUTES.pharmacies.searchOptions,
  revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.dictionary,
  staleWhileRevalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.dictionary,
});
