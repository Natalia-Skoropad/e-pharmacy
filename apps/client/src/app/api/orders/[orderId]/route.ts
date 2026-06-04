import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/backend-proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

type OrderRouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

//===================================================================

export async function GET(request: NextRequest, { params }: OrderRouteContext) {
  const { orderId } = await params;

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.orders.details(orderId),
    method: 'GET',
  });
}
