import { type NextRequest } from 'next/server';

import { proxyPublicBackendRequest } from '@e-pharmacy/api-client/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

type StoreRouteContext = {
  params: Promise<{
    storeId: string;
  }>;
};

//===================================================================

export async function GET(request: NextRequest, { params }: StoreRouteContext) {
  const { storeId } = await params;

  return proxyPublicBackendRequest({
    request,
    backendPath: API_ROUTES.stores.details(storeId),
  });
}
