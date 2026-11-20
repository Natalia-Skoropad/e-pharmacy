import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

export const POST = createPrivateProxyRoute<{ orderId: string }>({
  backendPath: ({ orderId }) => API_ROUTES.orders.cancel(orderId),
  method: 'POST',
});
