import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@/lib/api/backend-proxy';
import { API_ROUTES } from '@/lib/constants/api-routes';

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
