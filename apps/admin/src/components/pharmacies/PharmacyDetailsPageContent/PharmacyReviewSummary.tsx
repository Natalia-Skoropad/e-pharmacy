import {
  ClipboardList,
  CreditCard,
  FileText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import { MarkdownContent, WorkingHours } from '@e-pharmacy/ui/data-display';
import { ResponsivePhoto } from '@e-pharmacy/ui/media';
import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';

import { buildPharmacyComparisonRows } from './pharmacy-information-comparison';

import css from './PharmacyReviewSummary.module.css';

//===================================================================

type Section = 'data' | 'about' | 'payment' | 'documents';

//===================================================================

type Change = Readonly<{
  field: string;
  label: string;
  current: string | null | undefined;
  submitted: string | null | undefined;
  presentation?: 'photo' | 'hours' | 'markdown' | 'documents';
}>;

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

const DATA_FIELDS = [
  'name',
  'phone',
  'email',
  'workingHours',
  'imageUrl',
  'shortDescription',
  'location.address',
  'location.settlement',
  'location.region',
  'location.countryCode',
];

//===================================================================

export function getAdminPharmacySectionChanges(
  detail: AdminPharmacyDetail,
  section: Section
): readonly Change[] {
  const pending = detail.pendingChanges;

  if (!pending) return [];

  if (section === 'documents') {
    if (pending.documentsCount === undefined) return [];

    return [
      {
        field: 'documents',
        label: 'Pharmacy documents',

        current:
          detail.publishedDocumentNames?.join('\n') ??
          `${detail.documentCount} published file(s)`,

        submitted:
          pending.documentNames?.join('\n') ??
          `${pending.documentsCount} proposed file(s)`,

        presentation:
          pending.documentNames && detail.publishedDocumentNames
            ? 'documents'
            : undefined,
      },
    ];
  }

  if (section === 'payment') {
    return PAYMENT_FIELDS.filter(
      ([field]) =>
        pending.bankDetails &&
        field in pending.bankDetails &&
        (pending.bankDetails[field] ?? '') !==
          (detail.current.bankDetails?.[field] ?? '')
    ).map(([field, label]) => ({
      field: `payment.${field}`,
      label,
      current: detail.current.bankDetails?.[field],
      submitted: pending.bankDetails?.[field],
    }));
  }

  if (section === 'about')
    return pending.description === undefined ||
      (pending.description ?? '') === (detail.current.description ?? '')
      ? []
      : [
          {
            field: 'description',
            label: 'Description',
            current: detail.current.description,
            submitted: pending.description,
            presentation: 'markdown',
          },
        ];

  return buildPharmacyComparisonRows(detail)
    .filter((row) => DATA_FIELDS.includes(row.key) && row.changed)

    .map((row) => ({
      field: row.key,
      label: row.label,
      current: row.published === '—' ? null : row.published,
      submitted: row.submitted === '—' ? null : row.submitted,

      presentation:
        row.key === 'imageUrl'
          ? 'photo'
          : row.key === 'workingHours'
            ? 'hours'
            : undefined,
    }));
}

//===================================================================

function ReviewValue({
  change,
  value,
  otherValue,
}: Readonly<{
  change: Change;
  value: string | null | undefined;
  otherValue: string | null | undefined;
}>) {
  if (!value?.trim()) return <span>—</span>;

  if (change.presentation === 'documents') {
    const names = value.split('\n').filter(Boolean);
    const otherNames = new Set((otherValue ?? '').split('\n').filter(Boolean));

    return (
      <ul className={css.reviewDocuments}>
        {names.map((name, index) => (
          <li key={`${index}:${name}`}>
            {name}
            {!otherNames.has(name) ? (
              <span
                className={
                  value === change.current
                    ? css.reviewDocumentDifference
                    : css.reviewDocumentAdded
                }
              >
                {value === change.current ? 'Removed' : 'Added'}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  if (change.presentation === 'photo') {
    return (
      <div className={css.photo}>
        <ResponsivePhoto
          preset="table"
          src={value}
          alt={`${change.label} preview`}
          className={css.photoImage}
          sizes="110px"
          unoptimized
        />
      </div>
    );
  }

  if (change.presentation === 'hours')
    return <WorkingHours value={value} className={css.reviewWorkingHours} />;

  if (change.presentation === 'markdown')
    return <MarkdownContent value={value} />;

  return <span>{value}</span>;
}

//===================================================================

/** The exact owner-side comparison layout, without owner-only removal actions. */
export function PharmacyReviewSummary({
  detail,
  section,
}: Readonly<{ detail: AdminPharmacyDetail; section: Section }>) {
  const changed = getAdminPharmacySectionChanges(detail, section);

  // A correction request preserves the proposed fields for read-only review.
  // Its reason belongs to the status activity log, not every comparison tab.
  if (!changed.length) return null;

  const isCorrectionRequested = detail.reviewState === 'changes_requested';

  const isSubmitted =
    !isCorrectionRequested &&
    ['on_verification', 'on_moderation', 'on_reactivation'].includes(
      detail.status
    );

  return (
    <section
      className={css.card}
      aria-label="Verification and administrator feedback"
    >
      <ProfileSectionHeader
        title="Verification and administrator feedback"
        description={
          isCorrectionRequested
            ? 'These changes were returned to the owner for corrections. Published data remains unchanged until approval.'
            : isSubmitted
              ? 'These changes were submitted for review. Published data is unchanged until approval.'
              : 'These changes are saved for submission, or were returned to the owner for corrections.'
        }
        icon={<ShieldCheck size={21} aria-hidden="true" />}
      />

      <div className={css.grid}>
        {changed.map((change) => (
          <div className={css.item} key={change.field}>
            <strong className={css.label}>{change.label}</strong>
            <dl className={css.values}>
              <div className={css.value}>
                <dt>Saved / published</dt>
                <dd>
                  <ReviewValue
                    change={change}
                    value={change.current}
                    otherValue={change.submitted}
                  />
                </dd>
              </div>

              <div className={css.value}>
                <dt>
                  {isSubmitted
                    ? 'Submitted for review'
                    : 'Saved for submission'}
                </dt>
                <dd>
                  <ReviewValue
                    change={change}
                    value={change.submitted}
                    otherValue={change.current}
                  />
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

//===================================================================

// Match the owner's moderation dialog: same grouping, icons and hierarchy.
const MODERATION_TAB_ICONS: Record<string, LucideIcon> = {
  'Pharmacy data': ClipboardList,
  'About pharmacy': FileText,
  'Payment details': CreditCard,
  Documents: FileText,
};

//===================================================================

const SUMMARY_SECTIONS = [
  { id: 'data', title: 'Pharmacy data' },
  { id: 'about', title: 'About pharmacy' },
  { id: 'payment', title: 'Payment details' },
] as const;

//===================================================================

export function PharmacySubmittedChangesSummary({
  detail,
}: Readonly<{ detail: AdminPharmacyDetail }>) {
  const changes: Array<{
    id: Section | 'documents';
    title: string;
    fields: string[];
  }> = SUMMARY_SECTIONS.map((section) => ({
    ...section,
    fields: getAdminPharmacySectionChanges(detail, section.id).map(
      (field) => field.label
    ),
  })).filter(({ fields }) => fields.length > 0);

  if (detail.pendingChanges?.documentsCount !== undefined) {
    changes.push({
      id: 'documents',
      title: 'Documents',
      fields: ['Pharmacy documents'],
    });
  }

  // A verification decision can have no proposed profile fields (for example,
  // the pharmacy was first submitted with its already saved data). Do not show
  // a misleading empty-change message in the moderation dialog.
  if (!changes.length) return null;

  return (
    <section
      className={css.modalSummary}
      aria-label="Changes awaiting approval"
    >
      <strong>Changes awaiting administrator approval</strong>

      <ul>
        {changes.map((section) => {
          const Icon = MODERATION_TAB_ICONS[section.title] ?? FileText;

          return (
            <li key={section.title}>
              <span className={css.moderationTabIcon} aria-hidden="true">
                <Icon size={18} />
              </span>
              <div className={css.moderationTabDescription}>
                <strong>{section.title}</strong>{' '}
                <span>({section.fields.join(', ')})</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
