import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/proxy';
import { proxyPublicBackendRequest } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type ProductReviewsRouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

//===================================================================

export async function GET(
  request: NextRequest,
  { params }: ProductReviewsRouteContext
) {
  const { productId } = await params;

  return proxyPublicBackendRequest({
    request,
    backendPath: API_ROUTES.products.reviews(productId),
  });
}

//===================================================================

export async function POST(
  request: NextRequest,
  { params }: ProductReviewsRouteContext
) {
  const { productId } = await params;

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.products.reviews(productId),
    method: 'POST',
  });
}
