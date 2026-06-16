import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@e-pharmacy/api-client/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

type PharmacyCheckoutDetailsRouteContext = {
  params: Promise<{ pharmacyId: string }>;
};

//===================================================================

export async function GET(
  request: NextRequest,
  { params }: PharmacyCheckoutDetailsRouteContext
) {
  const { pharmacyId } = await params;

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.pharmacies.checkoutDetails(pharmacyId),
    method: 'GET',
  });
}
