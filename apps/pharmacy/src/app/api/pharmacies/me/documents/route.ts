import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const POST = createPrivateProxyRoute({
  backendPath: API_ROUTES.pharmacies.myDocumentUpload,
  method: 'POST',
});
