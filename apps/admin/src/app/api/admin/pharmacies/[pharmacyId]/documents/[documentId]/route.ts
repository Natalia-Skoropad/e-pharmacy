import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateDownloadProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type DocumentParams = { pharmacyId: string; documentId: string };

//===================================================================

export const GET = createPrivateDownloadProxyRoute<DocumentParams>({
  backendPath: ({ pharmacyId, documentId }) =>
    API_ROUTES.admin.pharmacyDocuments.download(pharmacyId, documentId),
});
