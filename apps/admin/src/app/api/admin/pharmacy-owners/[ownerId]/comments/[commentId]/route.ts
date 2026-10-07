import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type OwnerCommentRouteParams = {
  ownerId: string;
  commentId: string;
};

//===================================================================

export const DELETE = createPrivateProxyRoute<OwnerCommentRouteParams>({
  backendPath: ({ ownerId, commentId }) =>
    API_ROUTES.admin.pharmacyOwners.comment(ownerId, commentId),
  method: 'DELETE',
});
