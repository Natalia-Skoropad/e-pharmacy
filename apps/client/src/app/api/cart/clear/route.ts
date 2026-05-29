import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/backend-proxy';
import { API_ROUTES } from '@/lib/constants/api-routes';

//===================================================================

export async function DELETE(request: NextRequest) {
  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.cart.clear,
    method: 'DELETE',
  });
}
