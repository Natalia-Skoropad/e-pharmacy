import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type OrderCommentRouteParams = { orderId: string; commentId: string };

//===================================================================

export const DELETE = createPrivateProxyRoute<OrderCommentRouteParams>({
  backendPath: ({ orderId, commentId }) =>
    API_ROUTES.orders.comment(orderId, commentId),
  method: 'DELETE',
});
