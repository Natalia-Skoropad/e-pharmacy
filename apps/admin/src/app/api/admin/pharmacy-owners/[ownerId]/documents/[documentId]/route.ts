import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateDownloadProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type OwnerDocumentRouteParams = {
  ownerId: string;
  documentId: string;
};

//===================================================================

export const GET = createPrivateDownloadProxyRoute<OwnerDocumentRouteParams>({
  backendPath: ({ ownerId, documentId }) =>
    API_ROUTES.admin.pharmacyOwners.document(ownerId, documentId),
});
