import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@e-pharmacy/api-client/proxy';
import { proxyPublicBackendRequest } from '@e-pharmacy/api-client/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

type StoreReviewsRouteContext = {
  params: Promise<{
    storeId: string;
  }>;
};

//===================================================================

export async function GET(
  request: NextRequest,
  { params }: StoreReviewsRouteContext
) {
  const { storeId } = await params;

  return proxyPublicBackendRequest({
    request,
    backendPath: API_ROUTES.stores.reviews(storeId),
  });
}

//===================================================================

export async function POST(
  request: NextRequest,
  { params }: StoreReviewsRouteContext
) {
  const { storeId } = await params;

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.stores.reviews(storeId),
    method: 'POST',
  });
}
