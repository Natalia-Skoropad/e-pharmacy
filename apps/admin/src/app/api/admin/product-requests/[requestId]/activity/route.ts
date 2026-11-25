import { apiRoutes } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type Params = { requestId: string };

//===================================================================

const backendPath = ({ requestId }: Params) =>
  apiRoutes.admin.productRequests.activity(requestId);

//===================================================================

export const GET = createPrivateProxyRoute<Params>({
  backendPath,
  method: 'GET',
});
