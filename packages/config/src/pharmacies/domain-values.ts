import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

import type { Assert, IsExactValueSet } from '../internal/type-assertions';

//===================================================================

export const PHARMACY_STATUSES = [
  'new',
  'on_verification',
  'on_moderation',
  'active',
  'blocked',
] as const satisfies readonly PharmacyStatus[];

//===================================================================

type _PharmacyStatusesAreExhaustive = Assert<
  IsExactValueSet<PharmacyStatus, typeof PHARMACY_STATUSES>
>;
