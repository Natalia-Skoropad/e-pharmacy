import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type PharmacyRouteContext = {
  params: Promise<{
    pharmacyId: string;
  }>;
};

//===================================================================

export async function GET(request: NextRequest, { params }: PharmacyRouteContext) {
  const { pharmacyId } = await params;

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.pharmacies.details(pharmacyId),
  });
}
