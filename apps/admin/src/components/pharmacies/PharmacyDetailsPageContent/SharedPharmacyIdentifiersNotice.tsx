import Link from 'next/link';
import { AlertTriangle, ExternalLink } from 'lucide-react';

import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import { TableImagePreview } from '@e-pharmacy/ui/media';

import css from './SharedPharmacyIdentifiersNotice.module.css';

//===================================================================

const LABELS = {
  phone: 'Phone',
  email: 'Email',
  taxId: 'Tax ID / EDRPOU',
  iban: 'IBAN',
  receiptEmail: 'Receipt email',
} as const;

//===================================================================

type Field = keyof typeof LABELS;

//===================================================================

function getFieldValue(
  detail: AdminPharmacyDetail,
  field: Field
): string | null {
  if (field === 'phone') return detail.current.phone ?? null;
  if (field === 'email') return detail.current.email ?? null;
  if (field === 'taxId') return detail.current.bankDetails?.taxId ?? null;
  if (field === 'iban') return detail.current.bankDetails?.iban ?? null;

  if (field === 'receiptEmail')
    return detail.current.bankDetails?.receiptEmail ?? null;

  return null;
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

/** Read-only admin context: these are other pharmacies belonging to this owner. */
export function SharedPharmacyIdentifiersNotice({
  detail,
  fields,
}: Readonly<{ detail: AdminPharmacyDetail; fields: readonly Field[] }>) {
  const matches = fields.filter(
    (field) => detail.sharedIdentifiers?.[field]?.length
  );

  if (!matches.length) return null;

  return (
    <section className={css.notice} aria-label="Shared pharmacy details">
      <span className={css.icon} aria-hidden="true">
        <AlertTriangle size={18} />
      </span>

      <div className={css.content}>
        <strong>Details shared across this owner&apos;s pharmacies</strong>
        <p>
          The owner uses these published values in more than one pharmacy.
          Review the matching pharmacies below to verify repeated contact and
          payment details.
        </p>

        <ul className={css.fields}>
          {matches.map((field) => {
            const pharmacies = detail.sharedIdentifiers?.[field] ?? [];
            const value = getFieldValue(detail, field);

            return (
              <li key={field} className={css.fieldCard}>
                <div className={css.valueRow}>
                  <strong>{LABELS[field]}</strong>
                  <span>{value ?? '—'}</span>
                </div>

                <ul className={css.pharmacies}>
                  {pharmacies.map((pharmacy) => (
                    <li
                      key={`${field}-${pharmacy.id}`}
                      className={css.matchItem}
                    >
                      <TableImagePreview
                        src={pharmacy.imageUrl}
                        alt={`${pharmacy.name} photo`}
                        fallback={initials(pharmacy.name)}
                        size={36}
                      />

                      <Link
                        href={`/admin/pharmacies/${encodeURIComponent(pharmacy.id)}`}
                        className={css.pharmacyLink}
                      >
                        {pharmacy.name}
                      </Link>

                      <Link
                        href={`/admin/pharmacies/${encodeURIComponent(pharmacy.id)}`}
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
      </div>
    </section>
  );
}
