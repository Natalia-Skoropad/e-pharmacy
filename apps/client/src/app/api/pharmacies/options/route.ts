import { type NextRequest } from 'next/server';
import { apiRoutes } from '@e-pharmacy/api-client/contracts';
import { proxyPublicBackendRequest } from '@/lib/api/proxy';

//===================================================================

export async function GET(request: NextRequest) {
  return proxyPublicBackendRequest({
    request,
    backendPath: apiRoutes.pharmacies.options,
  });
}
