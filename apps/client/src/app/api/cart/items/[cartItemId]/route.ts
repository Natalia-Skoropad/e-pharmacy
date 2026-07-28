import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

//===================================================================

type CartItemRouteParams = {
  cartItemId: string;
};

//===================================================================

export const PATCH = createPrivateProxyRoute<CartItemRouteParams>({
  backendPath: ({ cartItemId }) => API_ROUTES.cart.item(cartItemId),
  method: 'PATCH',
});

//===================================================================

export const DELETE = createPrivateProxyRoute<CartItemRouteParams>({
  backendPath: ({ cartItemId }) => API_ROUTES.cart.item(cartItemId),
  method: 'DELETE',
});
