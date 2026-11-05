import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateDownloadProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateDownloadProxyRoute<{
  pharmacyId: string;
  auditLogId: string;
  side: 'before' | 'after';
}>({
  backendPath: ({ pharmacyId, auditLogId, side }) =>
    API_ROUTES.admin.pharmacyActivity.photo(pharmacyId, auditLogId, side),

  enumParams: { side: ['before', 'after'] },
});
