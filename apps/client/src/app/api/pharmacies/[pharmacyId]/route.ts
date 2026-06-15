import { type NextRequest } from 'next/server';

import { proxyPublicBackendRequest } from '@e-pharmacy/api-client/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

type PharmacyRouteContext = {
  params: Promise<{
    pharmacyId: string;
  }>;
};

//===================================================================

export async function GET(request: NextRequest, { params }: PharmacyRouteContext) {
  const { pharmacyId } = await params;

  return proxyPublicBackendRequest({
    request,
    backendPath: API_ROUTES.pharmacies.details(pharmacyId),
  });
}
