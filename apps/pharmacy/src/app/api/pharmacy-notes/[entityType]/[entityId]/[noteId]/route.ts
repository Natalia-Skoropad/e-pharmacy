import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { PHARMACY_NOTE_ENTITY_TYPES } from '@e-pharmacy/config/notes';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import type { PharmacyNoteEntityType } from '@e-pharmacy/types/notes';

//===================================================================

type Params = {
  entityType: PharmacyNoteEntityType;
  entityId: string;
  noteId: string;
};

//===================================================================

export const DELETE = createPrivateProxyRoute<Params>({
  backendPath: ({ entityType, entityId, noteId }) =>
    API_ROUTES.pharmacyNotes.details(entityType, entityId, noteId),
  method: 'DELETE',
  enumParams: { entityType: PHARMACY_NOTE_ENTITY_TYPES },
});
