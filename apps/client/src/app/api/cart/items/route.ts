import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/backend-proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

export async function POST(request: NextRequest) {
  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.cart.addItem,
    method: 'POST',
  });
}
