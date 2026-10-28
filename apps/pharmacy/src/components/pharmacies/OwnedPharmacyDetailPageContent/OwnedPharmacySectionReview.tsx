'use client';

import { useState } from 'react';
import { ShieldCheck, Trash2, X } from 'lucide-react';

import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';

import { MarkdownContent, WorkingHours } from '@e-pharmacy/ui/data-display';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { useToast } from '@e-pharmacy/ui/feedback';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { Button } from '@e-pharmacy/ui/primitives';
import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';

import { discardOwnedPharmacyPendingSection } from '@/lib/api/browser/owned-pharmacy-editor.api';
import { getProfileErrorMessage } from '@/lib/errors/get-profile-error-message';

import { FIELD_LABELS } from '../OwnedPharmacyEditor/pharmacy-editor-presentation';
import { Field, show } from './detail-fields';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

type Section = 'data' | 'about' | 'payment' | 'documents';

//===================================================================

type Comparison = Readonly<{
  label: string;
  field: string;
  current: string | null | undefined;
  submitted: string | null | undefined;
  richText?: boolean;
}>;

//===================================================================

function comparisons(
  section: Section,
  pharmacy: MyPharmacyProfile
): Comparison[] {
  const pending = pharmacy.pendingModeration;

  if (!pending) return [];

  if (section === 'about') {
    return pending.description !== undefined
      ? [
          {
            label: FIELD_LABELS.description,
            field: 'description',
            current: pharmacy.description,
            submitted: pending.description,
            richText: true,
          },
        ]
      : [];
  }

  if (section === 'documents') {
    return pending.documents !== undefined
      ? [
          {
            label: 'Pharmacy documents',
            field: 'documents',
            current: pharmacy.documents.map((doc) => doc.name).join('\n'),
            submitted: pending.documents.map((doc) => doc.name).join('\n'),
          },
        ]
      : [];
  }

  if (section === 'payment') {
    const keys = [
      'recipientName',
      'taxId',
      'iban',
      'bankName',
      'receiptEmail',
      'paymentPurpose',
    ] as const;

    return keys
      .filter((key) => pending.bankDetails && key in pending.bankDetails)

      .map((key) => ({
        label: FIELD_LABELS[key],
        field: key,
        richText: key === 'paymentPurpose',
        current: pharmacy.bankDetails?.[key],
        submitted: pending.bankDetails?.[key],
      }));
  }

  const fields: Comparison[] = [];

  for (const key of [
    'name',
    'phone',
    'email',
    'workingHours',
    'imageUrl',
    'shortDescription',
  ] as const) {
    if (key in pending) {
      fields.push({
        label: FIELD_LABELS[key],
        field: key,
        current: pharmacy[key],
        submitted: pending[key],
        richText: key === 'shortDescription',
      });
    }
  }
  for (const key of ['address', 'settlement', 'region'] as const) {
    if (pending.location && key in pending.location) {
      fields.push({
        label: FIELD_LABELS[key],
        field: key,
        current: pharmacy.location?.[key],
        submitted: pending.location[key],
      });
    }
  }
  return fields;
}

//===================================================================

/** Use the same read-only presentation as the public-facing pharmacy views. */
function ComparisonValue({
  change,
  value,
  otherValue,
}: Readonly<{
  change: Comparison;
  value: string | null | undefined;
  otherValue: string | null | undefined;
}>) {
  if (!value?.trim()) return <span className={css.reviewBody}>—</span>;

  if (change.field === 'imageUrl') {
    return (
      <div className={css.reviewPhoto}>
        <ShimmerImage
          src={value}
          alt={`${change.label} preview`}
          className={css.reviewPhotoImage}
          sizes="110px"
          unoptimized
        />
      </div>
    );
  }

  if (change.field === 'workingHours') {
    return <WorkingHours value={value} className={css.reviewWorkingHours} />;
  }

  if (change.field === 'documents') {
    const selectedNames = value.split('\n').filter(Boolean);
    const otherNames = new Set((otherValue ?? '').split('\n').filter(Boolean));

    return (
      <ul className={css.reviewDocuments}>
        {selectedNames.map((name) => (
          <li key={name}>
            {name}
            {!otherNames.has(name) ? (
              <span className={css.reviewDocumentDifference}>
                {value === change.current ? 'Removed' : 'Added'}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  if (change.richText) return <MarkdownContent value={value} />;

  return <span className={css.reviewBody}>{show(value)}</span>;
}

//===================================================================

export function OwnedPharmacySectionReview({
  section,
  pharmacy,
  onChanged,
}: Readonly<{
  section: Section;
  pharmacy: MyPharmacyProfile;
  onChanged: () => void;
}>) {
  const changed = comparisons(section, pharmacy);
  const toast = useToast();
  const [selectedChange, setSelectedChange] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);

  if (!changed.length) return null;

  const isSubmitted =
    (pharmacy.status === 'on_moderation' ||
      pharmacy.status === 'on_verification') &&
    pharmacy.reviewState !== 'changes_requested';

  const discard = async () => {
    if (busy || !selectedChange) return;

    setBusy(true);

    try {
      await discardOwnedPharmacyPendingSection(pharmacy.id, {
        section,
        field: selectedChange.field,
        expectedRevision: pharmacy.updatedAt,
      });

      setSelectedChange(null);
      toast.success('Saved changes removed successfully.');
      onChanged();
    } catch (error) {
      toast.error(
        getProfileErrorMessage(
          error,
          'Could not remove saved changes. Refresh and try again.'
        )
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={css.sectionCard}
      aria-label="Verification and administrator feedback"
    >
      <ProfileSectionHeader
        title="Verification and administrator feedback"
        description={
          isSubmitted
            ? 'The published values remain unchanged until the administrator reviews the submitted proposal.'
            : 'Your changes are saved but not submitted. Review them alongside the published values.'
        }
        icon={<ShieldCheck size={21} />}
      />

      {pharmacy.reviewFeedback ? (
        <div className={css.reviewFeedback}>
          <strong>Administrator feedback</strong>
          <p className={css.reviewBody}>{pharmacy.reviewFeedback}</p>
        </div>
      ) : null}

      <div className={css.reviewGrid}>
        {changed.map((change) => (
          <div className={css.reviewItem} key={change.field}>
            <div className={css.reviewItemHeading}>
              <strong>{change.label}</strong>
              {!isSubmitted ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className={css.reviewRemoveButton}
                  iconLeft={<Trash2 size={15} />}
                  onClick={() => setSelectedChange(change)}
                >
                  Remove change
                </Button>
              ) : null}
            </div>

            <dl className={css.reviewValues}>
              <Field label="Saved / published">
                <ComparisonValue
                  change={change}
                  value={change.current}
                  otherValue={change.submitted}
                />
              </Field>

              <Field
                label={
                  isSubmitted ? 'Submitted for review' : 'Saved for submission'
                }
              >
                <ComparisonValue
                  change={change}
                  value={change.submitted}
                  otherValue={change.current}
                />
              </Field>
            </dl>
          </div>
        ))}
      </div>

      <ConfirmationModal
        isOpen={Boolean(selectedChange)}
        eyebrow="PHARMACY CHANGES"
        title={`Remove ${selectedChange?.label ?? 'saved'} change?`}
        description="Only this unsubmitted field change will be discarded. Published data and all other saved changes will remain unchanged."
        confirmLabel="Remove changes"
        cancelLabel="Keep changes"
        destructive
        confirmIconLeft={<Trash2 size={17} />}
        cancelIconLeft={<X size={17} />}
        isLoading={busy}
        onConfirm={() => void discard()}
        onCancel={() => {
          if (!busy) setSelectedChange(null);
        }}
      />
    </section>
  );
}
