import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateDownloadProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

// Binary photos remain behind the Admin session and pharmacies.view permission.
// Using a separate image request avoids embedding base64 in the detail JSON.
export const GET = createPrivateDownloadProxyRoute<{ pharmacyId: string }>({
  backendPath: ({ pharmacyId }) =>
    API_ROUTES.admin.pharmacyDetail.photoSource(pharmacyId),
});
