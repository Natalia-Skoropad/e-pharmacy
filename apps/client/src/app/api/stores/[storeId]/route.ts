import { type NextRequest } from 'next/server';

import { proxyPublicBackendRequest } from '@/lib/api/public-backend-proxy';
import { API_ROUTES } from '@/lib/constants/api-routes';

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
