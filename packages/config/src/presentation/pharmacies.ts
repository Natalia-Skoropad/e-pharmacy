import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

import type { StatusPresentation } from './types';

//===================================================================

export const PHARMACY_STATUS_PRESENTATION = {
  new: { label: 'New', tone: 'info' },
  on_verification: { label: 'On verification', tone: 'warning' },
  on_moderation: { label: 'On moderation', tone: 'pending' },
  on_reactivation: { label: 'Reactivation requested', tone: 'mustard' },
  active: { label: 'Active', tone: 'success' },
  blocked: { label: 'Inactive', tone: 'danger' },
} as const satisfies Readonly<Record<PharmacyStatus, StatusPresentation>>;
