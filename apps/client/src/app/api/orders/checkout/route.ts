import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

export async function POST(request: NextRequest) {
  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.orders.checkout,
    method: 'POST',
  });
}
