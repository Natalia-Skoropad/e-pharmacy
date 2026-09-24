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
    API_ROUTES.admin.employees.myDocument(documentId),
});

//===================================================================

export const PUT = createPrivateProxyRoute<Params>({
  backendPath: ({ documentId }) =>
    API_ROUTES.admin.employees.myDocument(documentId),

  method: 'PUT',
  bodyPreset: 'documentUpload',
});

//===================================================================

export const DELETE = createPrivateProxyRoute<Params>({
  backendPath: ({ documentId }) =>
    API_ROUTES.admin.employees.myDocument(documentId),

  method: 'DELETE',
});
