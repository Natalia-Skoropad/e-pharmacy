import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { PHARMACY_NOTE_ENTITY_TYPES } from '@e-pharmacy/config/notes';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';
import type { PharmacyNoteEntityType } from '@e-pharmacy/types/notes';

//===================================================================

type Params = { entityType: PharmacyNoteEntityType; entityId: string };

const routeOptions = {
  backendPath: ({ entityType, entityId }: Params) =>
    API_ROUTES.pharmacyNotes.list(entityType, entityId),
  enumParams: { entityType: PHARMACY_NOTE_ENTITY_TYPES },
} as const;

//===================================================================

export const GET = createPrivateProxyRoute<Params>({
  ...routeOptions,
  method: 'GET',
});

//===================================================================

export const POST = createPrivateProxyRoute<Params>({
  ...routeOptions,
  method: 'POST',
});
