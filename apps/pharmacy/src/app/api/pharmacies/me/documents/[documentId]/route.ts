import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

import type { EntityId } from '@e-pharmacy/types/primitives';

//===================================================================

export const GET = createPrivateProxyRoute<{ documentId: EntityId }>({
  backendPath: ({ documentId }) =>
    API_ROUTES.pharmacies.myDocument(documentId),
});
