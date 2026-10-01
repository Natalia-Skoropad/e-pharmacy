import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type AdminPositionRouteParams = {
  positionId: string;
};

//===================================================================

export const PATCH = createPrivateProxyRoute<AdminPositionRouteParams>({
  backendPath: ({ positionId }) =>
    API_ROUTES.admin.positions.details(positionId),
  method: 'PATCH',
});

//===================================================================

export const DELETE = createPrivateProxyRoute<AdminPositionRouteParams>({
  backendPath: ({ positionId }) =>
    API_ROUTES.admin.positions.details(positionId),
  method: 'DELETE',
});
