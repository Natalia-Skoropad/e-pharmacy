import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import type { EditablePharmacyBankDetails } from '@e-pharmacy/types/pharmacies';

import {
  buildIbanError,
  buildTaxIdError,
  isCompletePharmacyBankDetails,
} from '@e-pharmacy/validation/pharmacy';

//===================================================================

const PAYMENT_FIELDS = [
  ['recipientName', 'Recipient name'],
  ['taxId', 'Tax ID / EDRPOU'],
  ['iban', 'IBAN'],
  ['bankName', 'Bank name'],
  ['receiptEmail', 'Receipt email'],
  ['paymentPurpose', 'Payment purpose'],
] as const;

//===================================================================

type PaymentField = (typeof PAYMENT_FIELDS)[number][0];

type PendingBankDetails = NonNullable<
  NonNullable<AdminPharmacyDetail['pendingChanges']>['bankDetails']
>;

//===================================================================

export type AdminPaymentRow = Readonly<{
  key: PaymentField;
  label: string;
  published: string;
  submitted?: string;
  changed?: boolean;
  publishedFormatIssue?: string;
  submittedFormatIssue?: string;
}>;

//===================================================================

function normalized(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

//===================================================================

function canonicalSensitive(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

//===================================================================

/** Admin-only read view: do not mask authorized published/submitted identifiers. */
export function displayPaymentValue(
  _field: PaymentField,
  value: string | null | undefined
): string {
  const clean = normalized(value);

  return clean || 'Not provided';
}

//===================================================================

function formatIssue(field: PaymentField, value: string | null | undefined) {
  const clean = normalized(value);
  if (!clean) return undefined;

  if (field === 'iban') {
    return buildIbanError(canonicalSensitive(clean))
      ? 'IBAN format needs review.'
      : undefined;
  }

  if (field === 'taxId') {
    return buildTaxIdError(clean) ? 'Tax ID format needs review.' : undefined;
  }

  return undefined;
}

//===================================================================

/** Values are restricted to the Admin-only detail API; never write them into audit logs. */
export function buildAdminPaymentRows(
  current: EditablePharmacyBankDetails | undefined,
  pending?: PendingBankDetails
): readonly AdminPaymentRow[] {
  return PAYMENT_FIELDS.map(([key, label]) => {
    const published = current?.[key];

    // An omitted field is NOT a pending deletion. Explicit null/'' is.
    const wasSubmitted = pending?.[key] !== undefined;
    const proposed = wasSubmitted ? pending?.[key] : undefined;

    return {
      key,
      label,
      published: displayPaymentValue(key, published),
      ...(formatIssue(key, published)
        ? { publishedFormatIssue: formatIssue(key, published) }
        : {}),

      ...(wasSubmitted
        ? {
            submitted: normalized(proposed)
              ? displayPaymentValue(key, proposed)
              : 'Will be cleared',

            changed:
              (key === 'iban' || key === 'taxId'
                ? canonicalSensitive(normalized(published))
                : normalized(published)) !==
              (key === 'iban' || key === 'taxId'
                ? canonicalSensitive(normalized(proposed))
                : normalized(proposed)),

            ...(formatIssue(key, proposed)
              ? { submittedFormatIssue: formatIssue(key, proposed) }
              : {}),
          }
        : {}),
    };
  });
}

//===================================================================

export function getPublishedPaymentStatus(
  detail: AdminPharmacyDetail
): 'available' | 'incomplete' {
  // Completeness is calculated ONLY from approved data. Pending patches do
  // not affect payment availability before a moderation decision.
  return detail.current.bankTransferAvailable &&
    isCompletePharmacyBankDetails(detail.current.bankDetails)
    ? 'available'
    : 'incomplete';
}

//===================================================================

export function getMissingPublishedPaymentFields(
  current: EditablePharmacyBankDetails | undefined
): readonly string[] {
  return PAYMENT_FIELDS.filter(([key]) => !normalized(current?.[key])).map(
    ([, label]) => label
  );
}
