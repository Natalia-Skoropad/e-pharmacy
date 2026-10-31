'use client';

import { AlertTriangle, Check, ExternalLink, PencilLine } from 'lucide-react';

import { formatInitials } from '@e-pharmacy/ui/data-display';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { TextActionButton } from '@e-pharmacy/ui/primitives';

import type {
  PharmacyPaymentMatches,
  PharmacyUniqueField,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import { getOwnedPharmacyPath } from '@/lib/routes';

import type { PharmacyEditorValues } from './pharmacy-editor-fields';

import css from './DuplicateIdentifierSaveModal.module.css';

//===================================================================

const LABELS: Record<PharmacyUniqueField, string> = {
  phone: 'Phone',
  email: 'Email',
  taxId: 'Tax ID / EDRPOU',
  iban: 'IBAN',
  receiptEmail: 'Receipt email',
};

//===================================================================

const FIELDS: PharmacyUniqueField[] = [
  'phone',
  'email',
  'taxId',
  'iban',
  'receiptEmail',
];

//===================================================================

export function getReusedIdentifierFields(
  matches: PharmacyPaymentMatches,
  values: PharmacyEditorValues,
  saved: PharmacyEditorValues,
  allowed: readonly string[] = FIELDS
): PharmacyUniqueField[] {
  return FIELDS.filter(
    (field) =>
      allowed.includes(field) &&
      Boolean(matches[field]?.length) &&
      values[field].trim().toLowerCase() !== saved[field].trim().toLowerCase()
  );
}

//===================================================================

export function DuplicateIdentifierSaveModal({
  open,
  fields,
  matches,
  values,
  busy,
  onConfirm,
  onCancel,
}: Readonly<{
  open: boolean;
  fields: readonly PharmacyUniqueField[];
  matches: PharmacyPaymentMatches;
  values: PharmacyEditorValues;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  return (
    <ConfirmationModal
      isOpen={open}
      eyebrow="SHARED PHARMACY DETAILS"
      title="Save details used by another of your pharmacies?"
      description={
        <div className={css.content}>
          <section className={css.notice} aria-label="Shared details notice">
            <span className={css.noticeIcon} aria-hidden="true">
              <AlertTriangle size={18} />
            </span>
            <div className={css.noticeCopy}>
              <strong>Shared pharmacy details</strong>
              <p>
                These values are also used by another pharmacy in your account.
                Sharing them is allowed, but please confirm before saving.
              </p>
            </div>
          </section>

          <ul className={css.list}>
            {fields.map((field) => (
              <li key={field} className={css.listItem}>
                <div className={css.valueRow}>
                  <strong>{LABELS[field]}</strong>
                  <span>{values[field]}</span>
                </div>

                <ul className={css.matchesList}>
                  {(matches[field] ?? []).map((pharmacy) => (
                    <li
                      key={`${field}-${pharmacy.id}`}
                      className={css.matchItem}
                    >
                      <TableImagePreview
                        src={pharmacy.imageUrl}
                        alt=""
                        fallback={formatInitials(pharmacy.name, 'P')}
                        size={34}
                      />

                      <TextActionButton
                        className={css.pharmacyLink}
                        href={getOwnedPharmacyPath(pharmacy.id)}
                      >
                        {pharmacy.name}
                      </TextActionButton>

                      <ExternalLink
                        className={css.linkIcon}
                        size={15}
                        aria-hidden="true"
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      }
      confirmLabel="Save shared details"
      cancelLabel="Review details"
      confirmIconLeft={<Check size={17} aria-hidden="true" />}
      cancelIconLeft={<PencilLine size={17} aria-hidden="true" />}
      isLoading={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
