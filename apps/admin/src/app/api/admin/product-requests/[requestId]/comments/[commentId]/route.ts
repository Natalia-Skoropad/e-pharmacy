import { apiRoutes } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type Params = { requestId: string; commentId: string };

//===================================================================

const backendPath = ({ requestId, commentId }: Params) =>
  apiRoutes.admin.productRequests.comment(requestId, commentId);

//===================================================================

export const DELETE = createPrivateProxyRoute<Params>({
  backendPath,
  method: 'DELETE',
});
