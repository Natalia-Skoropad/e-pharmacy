import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';

//===================================================================

/** Only explicitly submitted fields may appear in the proposed column. */
export type PharmacyComparisonRow = Readonly<{
  key: string;
  label: string;
  published: string;
  submitted: string;
  changed: boolean;
  presentation: 'text' | 'hours' | 'image' | 'private';
  verificationRequired?: boolean;
}>;

//===================================================================

const missing = (value: string | null | undefined): string =>
  value?.trim() || '—';

//===================================================================

/** A bank change is checked without exposing private account data in this tab. */
export function hasChangedBankDetails(detail: AdminPharmacyDetail): boolean {
  const submitted = detail.pendingChanges?.bankDetails;
  if (!submitted) return false;

  return Object.entries(submitted).some(
    ([key, value]) =>
      (value ?? '') !==
      (detail.current.bankDetails?.[
        key as keyof NonNullable<typeof detail.current.bankDetails>
      ] ?? '')
  );
}

//===================================================================

export function buildPharmacyComparisonRows(
  detail: AdminPharmacyDetail
): readonly PharmacyComparisonRow[] {
  const pending = detail.pendingChanges;
  if (!pending) return [];

  const rows: PharmacyComparisonRow[] = [];

  const add = (
    key: string,
    label: string,
    current: string | null | undefined,
    submitted: string | null | undefined,
    presentation: PharmacyComparisonRow['presentation'] = 'text'
  ) => {
    rows.push({
      key,
      label,
      published: missing(current),
      submitted: missing(submitted),
      changed: (current ?? '') !== (submitted ?? ''),
      presentation,
    });
  };

  if (pending.name !== undefined) {
    add('name', 'Pharmacy name', detail.current.name, pending.name);
  }

  if (pending.location !== undefined) {
    const locationFields = [
      ['settlement', 'Settlement'],
      ['region', 'Region'],
      ['address', 'Pharmacy address'],
      ['countryCode', 'Country code'],
    ] as const;

    for (const [field, label] of locationFields) {
      // Omitted fields in a partial location draft are not submissions.
      if (pending.location[field] !== undefined) {
        add(
          `location.${field}`,
          label,
          detail.current.location?.[field],
          pending.location[field]
        );
      }
    }
  }

  if (pending.phone !== undefined) {
    add('phone', 'Phone', detail.current.phone, pending.phone);
  }

  if (pending.email !== undefined) {
    add('email', 'Email', detail.current.email, pending.email);
  }

  if (pending.workingHours !== undefined) {
    add(
      'workingHours',
      'Working hours',
      detail.current.workingHours,
      pending.workingHours,
      'hours'
    );
  }

  if (pending.imageUrl !== undefined) {
    add(
      'imageUrl',
      'Pharmacy photo',
      detail.current.imageUrl,
      pending.imageUrl,
      'image'
    );
  }

  if (pending.description !== undefined) {
    add(
      'description',
      'Description',
      detail.current.description,
      pending.description
    );
  }

  if (pending.documentsCount !== undefined) {
    // Equal counts do not prove that the documents themselves are identical.
    rows.push({
      key: 'documents',
      label: 'Documents',
      published: `${detail.documentCount} attached`,
      submitted: `${pending.documentsCount} submitted`,
      changed: true,
      verificationRequired: true,
      presentation: 'text',
    });
  }

  if (pending.bankDetails !== undefined) {
    const changed = hasChangedBankDetails(detail);

    rows.push({
      key: 'bankDetails',
      label: 'Payment details',
      published: 'Private details (not displayed)',
      submitted: 'Submitted for moderation (values hidden)',
      changed,
      presentation: 'private',
    });
  }

  return rows;
}
