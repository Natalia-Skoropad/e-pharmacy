import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type Params = { entityType: string; entityId: string; noteId: string };

//===================================================================

export const DELETE = createPrivateProxyRoute<Params>({
  backendPath: ({ entityType, entityId, noteId }) =>
    `/pharmacy-notes/${entityType}/${entityId}/${noteId}`,
  method: 'DELETE',
});
