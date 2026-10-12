import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type CommentParams = { pharmacyId: string; commentId: string };

//===================================================================

export const DELETE = createPrivateProxyRoute<CommentParams>({
  backendPath: ({ pharmacyId, commentId }) =>
    API_ROUTES.admin.pharmacyComments.detail(pharmacyId, commentId),
  method: 'DELETE',
});
