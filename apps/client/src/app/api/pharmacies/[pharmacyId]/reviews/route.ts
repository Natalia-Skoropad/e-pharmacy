import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/proxy';
import { proxyPublicBackendRequest } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type PharmacyReviewsRouteContext = {
  params: Promise<{
    pharmacyId: string;
  }>;
};

//===================================================================

export async function GET(
  request: NextRequest,
  { params }: PharmacyReviewsRouteContext
) {
  const { pharmacyId } = await params;

  return proxyPublicBackendRequest({
    request,
    backendPath: API_ROUTES.pharmacies.reviews(pharmacyId),
  });
}

//===================================================================

export async function POST(
  request: NextRequest,
  { params }: PharmacyReviewsRouteContext
) {
  const { pharmacyId } = await params;

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.pharmacies.reviews(pharmacyId),
    method: 'POST',
  });
}
