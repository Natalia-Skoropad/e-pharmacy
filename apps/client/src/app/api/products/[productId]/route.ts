import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

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

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.products.details(productId),
  });
}
