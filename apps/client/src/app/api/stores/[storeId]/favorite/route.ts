import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@e-pharmacy/api-client/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

type StoreFavoriteRouteContext = {
  params: Promise<{
    storeId: string;
  }>;
};

//===================================================================

export async function PATCH(
  request: NextRequest,
  { params }: StoreFavoriteRouteContext
) {
  const { storeId } = await params;

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.stores.favorite(storeId),
    method: 'PATCH',
  });
}
