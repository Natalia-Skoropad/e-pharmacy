import type {
  CompletePharmacyBankDetails,
  EditablePharmacyBankDetails,
} from '../../types/pharmacies/pharmacy';

//===============================================================

// Keep bank transfer eligibility identical for public availability, orders,
// moderation and Admin detail. A partial patch is never a complete account.
export const COMPLETE_BANK_DETAIL_FIELDS = [
  'recipientName',
  'taxId',
  'iban',
  'bankName',
  'receiptEmail',
  'paymentPurpose',
] as const;

//===============================================================

export function hasCompleteBankDetails(
  details?: EditablePharmacyBankDetails | null
): details is CompletePharmacyBankDetails {
  return COMPLETE_BANK_DETAIL_FIELDS.every((field) =>
    Boolean(details?.[field])
  );
}
