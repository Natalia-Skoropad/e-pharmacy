import { createPublicGetProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { PUBLIC_CACHE_REVALIDATE_SECONDS } from '@/lib/api/public-cache-policy';

//===================================================================

// The proxy forwards the validated query to the backend; no unbounded lists.
export const GET = createPublicGetProxyRoute({
  backendPath: API_ROUTES.pharmacies.searchOptions,

  // This collection-wide name/phone/address lookup may exceed the 6s default
  // until its MongoDB query plan is optimized. Do not extend other BFF routes.
  timeoutMs: 18_000,
  revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.dictionary,
  staleWhileRevalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.dictionary,
});
