import type { PublicPaymentBankDetails } from '@e-pharmacy/types/pharmacies';

//===================================================================

export type PharmacyBankDetailsState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'success'; data: PublicPaymentBankDetails }>
  | Readonly<{ status: 'empty' }>
  | Readonly<{ status: 'error'; error: unknown }>;

//===================================================================

export function canLoadPharmacyBankDetails(
  state: PharmacyBankDetailsState,
  force = false
): boolean {
  if (state.status === 'loading') return false;
  if (force) return true;
  return state.status !== 'success' && state.status !== 'empty';
}
