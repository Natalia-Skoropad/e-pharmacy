import { createPublicGetProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type PharmacyRouteParams = { pharmacyId: string };

//===================================================================

// Binary media stays within the BFF: public status is checked by the backend.
// A short TTL avoids stale public images after a status transition.
export const GET = createPublicGetProxyRoute<PharmacyRouteParams>({
  backendPath: ({ pharmacyId }) =>
    API_ROUTES.pharmacies.photoSource(pharmacyId),

  responseType: 'image',
  timeoutMs: 20_000,
  revalidate: 30,
  staleWhileRevalidate: 0,
});
