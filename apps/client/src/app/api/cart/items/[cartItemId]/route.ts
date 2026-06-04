import { type NextRequest } from 'next/server';

import { proxyBackendRequest } from '@e-pharmacy/api-client/proxy';
import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client';

//===================================================================

type CartItemRouteContext = {
  params: Promise<{
    cartItemId: string;
  }>;
};

//===================================================================

export async function PATCH(
  request: NextRequest,
  { params }: CartItemRouteContext
) {
  const { cartItemId } = await params;

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.cart.updateItem(cartItemId),
    method: 'PATCH',
  });
}

//===================================================================

export async function DELETE(
  request: NextRequest,
  { params }: CartItemRouteContext
) {
  const { cartItemId } = await params;

  return proxyBackendRequest({
    request,
    backendPath: API_ROUTES.cart.removeItem(cartItemId),
    method: 'DELETE',
  });
}
