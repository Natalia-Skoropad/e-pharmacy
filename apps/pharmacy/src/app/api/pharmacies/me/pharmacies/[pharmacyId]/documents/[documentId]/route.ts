import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateDownloadProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const GET = createPrivateDownloadProxyRoute<{
  pharmacyId: string;
  documentId: string;
}>({
  backendPath: ({ pharmacyId, documentId }) =>
    API_ROUTES.pharmacies.ownedDocument(pharmacyId, documentId),
});
