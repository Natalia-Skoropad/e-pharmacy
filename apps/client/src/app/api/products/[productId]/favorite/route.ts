import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/backend-proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

type ProductFavoriteRouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

//===================================================================

export async function PATCH(
  request: NextRequest,
  { params }: ProductFavoriteRouteContext
) {
  const { productId } = await params;

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.products.favorite(productId),
    method: 'PATCH',
  });
}
