import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/backend-proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.orders.list,
    method: 'GET',
  });
}
