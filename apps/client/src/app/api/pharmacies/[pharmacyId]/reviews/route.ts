import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@e-pharmacy/api-client/proxy';
import { proxyPublicBackendRequest } from '@e-pharmacy/api-client/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

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
