import type { PharmacyNoteEntityType } from '@e-pharmacy/types/notes';

//===================================================================

export const PHARMACY_NOTE_ENTITY_TYPES = [
  'client',
  'product',
  'pharmacy',
  'product_request',
] as const satisfies readonly PharmacyNoteEntityType[];
