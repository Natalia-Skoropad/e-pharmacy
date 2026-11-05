import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateDownloadProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateDownloadProxyRoute<{
  auditLogId: string;
  side: 'before' | 'after';
}>({
  backendPath: ({ auditLogId, side }) =>
    API_ROUTES.admin.audit.photo(auditLogId, side),

  enumParams: { side: ['before', 'after'] },
});
