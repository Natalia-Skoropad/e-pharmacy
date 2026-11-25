import { apiRoutes } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type Params = { requestId: string; auditLogId: string };

//===================================================================

const backendPath = ({ requestId, auditLogId }: Params) =>
  apiRoutes.admin.productRequests.activityDetail(requestId, auditLogId);

//===================================================================

export const GET = createPrivateProxyRoute<Params>({
  backendPath,
  method: 'GET',
});
