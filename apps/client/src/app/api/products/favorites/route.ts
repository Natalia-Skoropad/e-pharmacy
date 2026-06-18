import { type NextRequest } from 'next/server';
import { apiRoutes } from '@e-pharmacy/api-client/contracts';
import { proxyBackendRequest } from '@/lib/api/proxy';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyBackendRequest({
    request,
    backendPath: `${apiRoutes.products.favorites}${request.nextUrl.search}`,
    method: 'GET',
  });
}
