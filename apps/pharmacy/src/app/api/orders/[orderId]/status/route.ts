import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type OrderStatusRouteParams = {
  orderId: string;
};

//===================================================================

export const PATCH = createPrivateProxyRoute<OrderStatusRouteParams>({
  backendPath: ({ orderId }) => `${API_ROUTES.orders.details(orderId)}/status`,
  method: 'PATCH',
});
