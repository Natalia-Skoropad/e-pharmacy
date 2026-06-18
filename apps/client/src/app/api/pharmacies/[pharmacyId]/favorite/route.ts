import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type PharmacyFavoriteRouteContext = {
  params: Promise<{
    pharmacyId: string;
  }>;
};

//===================================================================

export async function PATCH(
  request: NextRequest,
  { params }: PharmacyFavoriteRouteContext
) {
  const { pharmacyId } = await params;

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.pharmacies.favorite(pharmacyId),
    method: 'PATCH',
  });
}
