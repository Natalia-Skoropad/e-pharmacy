import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';

import { FIELD_LABELS } from '../OwnedPharmacyEditor/pharmacy-editor-presentation';

//===================================================================

export type ModerationSummaryGroup = Readonly<{
  title: string;
  fields: readonly string[];
}>;

//===================================================================

/** Display only saved, changed fields, grouped like their editor tabs. */
export function getPharmacyModerationSummary(
  pharmacy: MyPharmacyProfile
): ModerationSummaryGroup[] {
  const pending = pharmacy.pendingModeration;

  if (!pending) return [];

  const data: string[] = [];
  const about: string[] = [];
  const payment: string[] = [];
  const documents: string[] = [];

  for (const key of [
    'name',
    'phone',
    'email',
    'shortDescription',
    'workingHours',
    'imageUrl',
  ] as const) {
    if (
      pending[key] !== undefined &&
      (pending[key] ?? '') !== (pharmacy[key] ?? '')
    ) {
      data.push(FIELD_LABELS[key]);
    }
  }

  for (const key of ['address', 'settlement', 'region'] as const) {
    const proposed = pending.location?.[key];

    if (
      proposed !== undefined &&
      (proposed ?? '') !== (pharmacy.location?.[key] ?? '')
    ) {
      data.push(FIELD_LABELS[key]);
    }
  }

  if (
    pending.description !== undefined &&
    (pending.description ?? '') !== (pharmacy.description ?? '')
  ) {
    about.push(FIELD_LABELS.description);
  }

  for (const key of [
    'recipientName',
    'taxId',
    'iban',
    'bankName',
    'receiptEmail',
    'paymentPurpose',
  ] as const) {
    const proposed = pending.bankDetails?.[key];

    if (
      proposed !== undefined &&
      (proposed ?? '') !== (pharmacy.bankDetails?.[key] ?? '')
    ) {
      payment.push(FIELD_LABELS[key]);
    }
  }

  if (pending.documents !== undefined) {
    const publishedIds = pharmacy.documents.map((doc) => doc.id).sort();
    const proposedIds = pending.documents.map((doc) => doc.id).sort();

    if (JSON.stringify(publishedIds) !== JSON.stringify(proposedIds)) {
      documents.push('Pharmacy documents');
    }
  }

  return [
    { title: 'Pharmacy data', fields: data },
    { title: 'About pharmacy', fields: about },
    { title: 'Payment details', fields: payment },
    { title: 'Documents', fields: documents },
  ].filter((group) => group.fields.length > 0);
}
