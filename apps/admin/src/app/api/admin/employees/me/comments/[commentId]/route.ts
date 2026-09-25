import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import type { EntityId } from '@e-pharmacy/types/primitives';

//===================================================================

type Params = { commentId: EntityId };

//===================================================================

export const DELETE = createPrivateProxyRoute<Params>({
  backendPath: ({ commentId }) =>
    API_ROUTES.admin.employees.myComment(commentId),
  method: 'DELETE',
});
