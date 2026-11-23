import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateDownloadProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateDownloadProxyRoute<{
  requestId: string;
  documentId: string;
}>({
  backendPath: ({ requestId, documentId }) =>
    API_ROUTES.admin.productRequestDocuments.download(requestId, documentId),
});
