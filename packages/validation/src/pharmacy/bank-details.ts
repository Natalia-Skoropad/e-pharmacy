import type {
  CompletePharmacyBankDetails,
  EditablePharmacyBankDetails,
} from '@e-pharmacy/types/pharmacies';

//===================================================================

export function isCompletePharmacyBankDetails(
  value: EditablePharmacyBankDetails | null | undefined
): value is CompletePharmacyBankDetails {
  return Boolean(
    value?.recipientName?.trim() &&
    value.taxId?.trim() &&
    value.iban?.trim() &&
    value.bankName?.trim() &&
    value.receiptEmail?.trim() &&
    value.paymentPurpose?.trim()
  );
}
