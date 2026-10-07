import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';

import {
  createPrivateDownloadProxyRoute,
  createPrivateProxyRoute,
} from '@e-pharmacy/next-api/proxy';

import type { EntityId } from '@e-pharmacy/types/primitives';

//===================================================================

type Params = { documentId: EntityId };

//===================================================================

export const GET = createPrivateDownloadProxyRoute<Params>({
  backendPath: ({ documentId }) =>
    API_ROUTES.pharmacyOwners.myDocument(documentId),
});

//===================================================================

export const DELETE = createPrivateProxyRoute<Params>({
  backendPath: ({ documentId }) =>
    API_ROUTES.pharmacyOwners.myDocument(documentId),
  method: 'DELETE',
});
