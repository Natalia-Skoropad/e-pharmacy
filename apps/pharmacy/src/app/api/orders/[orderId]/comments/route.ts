import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type OrderCommentsRouteParams = { orderId: string };

//===================================================================

export const GET = createPrivateProxyRoute<OrderCommentsRouteParams>({
  backendPath: ({ orderId }) => API_ROUTES.orders.comments(orderId),
  method: 'GET',
});

export const POST = createPrivateProxyRoute<OrderCommentsRouteParams>({
  backendPath: ({ orderId }) => API_ROUTES.orders.comments(orderId),
  method: 'POST',
});
