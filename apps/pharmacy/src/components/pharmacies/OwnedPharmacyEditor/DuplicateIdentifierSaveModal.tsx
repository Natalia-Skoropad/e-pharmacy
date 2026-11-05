'use client';

import Link from 'next/link';
import { AlertTriangle, ExternalLink, PencilLine, Save } from 'lucide-react';

import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';
import { Button, CloseIconButton } from '@e-pharmacy/ui/primitives';

import type {
  PharmacyPaymentMatches,
  PharmacyUniqueField,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import css from './DuplicateIdentifierSaveModal.module.css';

//===================================================================

type IdentifierValues = Readonly<{
  phone: string;
  email: string;
  taxId: string;
  iban: string;
  receiptEmail: string;
}>;

type ReusedField = PharmacyUniqueField;

const DEFAULT_REUSED_FIELDS: readonly ReusedField[] = [
  'phone',
  'email',
  'taxId',
  'iban',
  'receiptEmail',
];

type DuplicateIdentifierSaveModalProps = Readonly<{
  open: boolean;
  fields: readonly ReusedField[];
  matches: PharmacyPaymentMatches;
  values: IdentifierValues;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>;

type MatchItem = Readonly<{
  id: string;
  name: string;
  imageUrl?: string | null;
}>;

//===================================================================

const FIELD_LABELS: Record<ReusedField, string> = {
  phone: 'Phone',
  email: 'Email',
  taxId: 'Tax ID / EDRPOU',
  iban: 'IBAN',
  receiptEmail: 'Receipt email',
};

//===================================================================

function normalizeMatches(
  matches: PharmacyPaymentMatches,
  field: ReusedField
): readonly MatchItem[] {
  const items = matches[field];

  if (!Array.isArray(items)) return [];

  return items.flatMap((item) => {
    const candidate = item as Record<string, unknown>;
    const id = typeof candidate.id === 'string' ? candidate.id : null;
    const name = typeof candidate.name === 'string' ? candidate.name : null;

    if (!id || !name) return [];

    const imageUrl =
      typeof candidate.imageUrl === 'string'
        ? candidate.imageUrl
        : typeof candidate.photoUrl === 'string'
          ? candidate.photoUrl
          : typeof candidate.pictureUrl === 'string'
            ? candidate.pictureUrl
            : null;

    return [{ id, name, imageUrl }];
  });
}

//===================================================================

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

//===================================================================

function valueForField(values: IdentifierValues, field: ReusedField): string {
  return values[field]?.trim() ?? '';
}

//===================================================================

export function getReusedIdentifierFields(
  matches: PharmacyPaymentMatches,
  values: IdentifierValues,
  saved: IdentifierValues,
  fields: readonly ReusedField[] = DEFAULT_REUSED_FIELDS
): readonly ReusedField[] {
  return fields.filter((field) => {
    const value = valueForField(values, field).toLowerCase();
    const savedValue = valueForField(saved, field).toLowerCase();

    return value !== savedValue && normalizeMatches(matches, field).length > 0;
  });
}

//===================================================================

export function DuplicateIdentifierSaveModal({
  open,
  fields,
  matches,
  values,
  busy = false,
  onConfirm,
  onCancel,
}: DuplicateIdentifierSaveModalProps) {
  return (
    <ModalRoot>
      <ModalBase
        isOpen={open}
        labelledBy="duplicate-shared-details-title"
        dialogClassName={css.scrollableDialog}
        onClose={onCancel}
      >
        <div className={css.content}>
          <div className={css.header}>
            <div>
              <p className={css.eyebrow}>Shared pharmacy details</p>
              <h2 id="duplicate-shared-details-title" className={css.title}>
                Save details used by another of your pharmacies?
              </h2>
            </div>
            <CloseIconButton
              label="Close shared details confirmation"
              onClick={onCancel}
            />
          </div>

          <section
            className={css.notice}
            aria-label="Shared pharmacy details notice"
          >
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
            {fields.map((field) => {
              const fieldMatches = normalizeMatches(matches, field);
              const value = valueForField(values, field);

              if (!fieldMatches.length) return null;

              return (
                <li key={field} className={css.listItem}>
                  <div className={css.valueRow}>
                    <strong>{FIELD_LABELS[field]}</strong>
                    <span>{value}</span>
                  </div>

                  <ul className={css.matchesList}>
                    {fieldMatches.map((pharmacy) => (
                      <li
                        key={`${field}-${pharmacy.id}`}
                        className={css.matchItem}
                      >
                        <span className={css.avatar} aria-hidden="true">
                          {pharmacy.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={pharmacy.imageUrl} alt="" />
                          ) : (
                            <span>{initials(pharmacy.name)}</span>
                          )}
                        </span>

                        <Link
                          href={`/pharmacy/pharmacies/${encodeURIComponent(pharmacy.id)}`}
                          className={css.pharmacyLink}
                        >
                          {pharmacy.name}
                        </Link>

                        <Link
                          href={`/pharmacy/pharmacies/${encodeURIComponent(pharmacy.id)}`}
                          className={css.linkIcon}
                          aria-label={`Open ${pharmacy.name}`}
                        >
                          <ExternalLink size={16} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>

          <div className={css.actions}>
            <Button
              type="button"
              iconLeft={<Save size={17} />}
              isLoading={busy}
              onClick={onConfirm}
            >
              Save shared details
            </Button>
            <Button
              type="button"
              variant="secondary"
              iconLeft={<PencilLine size={17} />}
              onClick={onCancel}
            >
              Review details
            </Button>
          </div>
        </div>
      </ModalBase>
    </ModalRoot>
  );
}
