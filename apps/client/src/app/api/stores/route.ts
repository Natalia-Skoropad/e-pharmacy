import { type NextRequest } from 'next/server';

import { proxyPublicBackendRequest } from '@/lib/api/public-backend-proxy';
import { API_ROUTES } from '@/lib/constants/api-routes';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyPublicBackendRequest({
    request,
    backendPath: API_ROUTES.stores.list,
  });
}
