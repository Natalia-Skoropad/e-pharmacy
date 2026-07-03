import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type OrderRouteParams = {
  orderId: string;
};

//===================================================================

export const GET = createPrivateProxyRoute<OrderRouteParams>({
  backendPath: ({ orderId }) => API_ROUTES.orders.details(orderId),
  method: 'GET',
});
