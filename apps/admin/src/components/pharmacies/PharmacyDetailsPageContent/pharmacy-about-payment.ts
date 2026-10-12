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

/** Account identifiers must never be included in rendered text or attributes. */
export function maskedPaymentValue(
  field: PaymentField,
  value: string | null | undefined
): string {
  const clean = normalized(value);

  if (!clean) return 'Not provided';
  if (field !== 'iban' && field !== 'taxId') return clean;

  const canonical = canonicalSensitive(clean);
  const lastFour = canonical.length >= 4 ? canonical.slice(-4) : '';

  return field === 'iban'
    ? `UA •••• •••• •••• ${lastFour || '••••'}`
    : `•••• ${lastFour || '••••'}`;
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

/** Build only display-safe rows; never place raw account numbers in UI props. */
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
      published: maskedPaymentValue(key, published),
      ...(formatIssue(key, published)
        ? { publishedFormatIssue: formatIssue(key, published) }
        : {}),

      ...(wasSubmitted
        ? {
            submitted: normalized(proposed)
              ? maskedPaymentValue(key, proposed)
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
