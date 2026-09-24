import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type AdminAuditDetailsRouteParams = {
  auditLogId: string;
};

//===================================================================

export const GET = createPrivateProxyRoute<AdminAuditDetailsRouteParams>({
  backendPath: ({ auditLogId }) => API_ROUTES.admin.audit.details(auditLogId),
  method: 'GET',
});
