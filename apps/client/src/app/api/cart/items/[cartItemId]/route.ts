import { createPrivateProxyRoute } from '@/lib/api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type CartItemRouteParams = {
  cartItemId: string;
};

//===================================================================

export const PATCH = createPrivateProxyRoute<CartItemRouteParams>({
  backendPath: ({ cartItemId }) => API_ROUTES.cart.updateItem(cartItemId),
  method: 'PATCH',
});

//===================================================================

export const DELETE = createPrivateProxyRoute<CartItemRouteParams>({
  backendPath: ({ cartItemId }) => API_ROUTES.cart.removeItem(cartItemId),
  method: 'DELETE',
});
