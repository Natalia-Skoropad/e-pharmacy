import { type NextRequest } from 'next/server';

import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { proxyBackendRequest } from '@/lib/api/proxy';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyBackendRequest({
    backendPath: API_ROUTES.products.favoriteIds,
    request,
    method: 'GET',
  });
}
