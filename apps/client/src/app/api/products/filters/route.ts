import { type NextRequest } from 'next/server';

import { proxyPublicBackendRequest } from '@/lib/api/public-backend-proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyPublicBackendRequest({
    request,
    backendPath: API_ROUTES.products.filters,
  });
}
