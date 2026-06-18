import { type NextRequest } from 'next/server';

import { proxyPublicBackendRequest } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyPublicBackendRequest({
    request,
    backendPath: API_ROUTES.products.list,
  });
}
