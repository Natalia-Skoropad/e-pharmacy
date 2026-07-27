import type { PharmacyNoteEntityType } from '@e-pharmacy/types/notes';

import type { Assert, IsExactValueSet } from '../internal/type-assertions';

//===================================================================

export const PHARMACY_NOTE_ENTITY_TYPES = [
  'client',
  'product',
  'pharmacy',
  'product_request',
] as const satisfies readonly PharmacyNoteEntityType[];

//===================================================================

type _PharmacyNoteEntityTypesAreExhaustive = Assert<
  IsExactValueSet<PharmacyNoteEntityType, typeof PHARMACY_NOTE_ENTITY_TYPES>
>;
