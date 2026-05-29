import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/backend-proxy';
import { API_ROUTES } from '@/lib/constants/api-routes';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.cart.current,
    method: 'GET',
  });
}
