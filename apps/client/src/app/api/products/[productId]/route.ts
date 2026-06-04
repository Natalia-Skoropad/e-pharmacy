import { type NextRequest } from 'next/server';

import { proxyPublicBackendRequest } from '@/lib/api/public-backend-proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

type ProductRouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

//===================================================================

export async function GET(
  request: NextRequest,
  { params }: ProductRouteContext
) {
  const { productId } = await params;

  return proxyPublicBackendRequest({
    request,
    backendPath: API_ROUTES.products.details(productId),
  });
}
