import { type NextRequest } from 'next/server';

import { proxyPublicBackendRequest } from '@/lib/api/public-backend-proxy';
import { API_ROUTES } from '@/lib/constants/api-routes';

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
