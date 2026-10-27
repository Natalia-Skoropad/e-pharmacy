'use client';

import { ShieldCheck } from 'lucide-react';

import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type {
  MyPharmacyProfile,
  OwnedPharmacyDetailResponse,
  PharmacyPendingModeration,
} from '@e-pharmacy/types/pharmacies';

import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { show, DateValue, Field, Photo, Contact } from './detail-fields';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

const COMPARABLE: readonly {
  label: string;

  key: keyof Omit<
    PharmacyPendingModeration,
    'location' | 'bankDetails' | 'documents'
  >;
}[] = [
  { label: 'Name', key: 'name' },
  { label: 'Phone', key: 'phone' },
  { label: 'Email', key: 'email' },
  { label: 'Photo', key: 'imageUrl' },
  { label: 'Short description', key: 'shortDescription' },
  { label: 'About pharmacy', key: 'description' },
];

//===================================================================

function PendingChanges({
  pending,
  pharmacy,
}: {
  pending: PharmacyPendingModeration;
  pharmacy: MyPharmacyProfile;
}) {
  const changed: Array<{
    label: string;
    published?: string | null;
    submitted?: string | null;
  }> = COMPARABLE.filter(({ key }) => key in pending).map(({ key, label }) => ({
    label,
    published: pharmacy[key],
    submitted: pending[key],
  }));

  for (const key of ['region', 'settlement', 'address'] as const) {
    if (pending.location && key in pending.location)
      changed.push({
        label:
          key === 'address'
            ? 'Pharmacy address'
            : key === 'region'
              ? 'Region'
              : 'Settlement',

        published: pharmacy.location?.[key],
        submitted: pending.location[key],
      });
  }

  return (
    <section className={css.sectionCard} aria-label="Submitted changes">
      <div className={css.sectionHeading}>
        <ShieldCheck size={20} />
        <h3>Published data / Submitted changes</h3>
      </div>

      <p className={css.muted}>
        Proposed changes are not public until approved by an administrator.
      </p>

      {changed.length ||
      pending.workingHours !== undefined ||
      pending.bankDetails ||
      pending.documents ? (
        <dl className={css.compareGrid}>
          {changed.map(({ label, published, submitted }) => (
            <div className={css.compareRow} key={label}>
              <dt>
                {label}
                <span>Changed · not approved</span>
              </dt>
              <dd>
                <small>Published data</small>
                {show(published)}
              </dd>
              <dd>
                <small>Submitted changes</small>
                {show(submitted)}
              </dd>
            </div>
          ))}

          {pending.workingHours !== undefined && (
            <div className={css.compareRow}>
              <dt>Working hours (managed in Pharmacy data)</dt>
              <dd>
                <small>Published data</small>
                {show(pharmacy.workingHours)}
              </dd>
              <dd>
                <small>Submitted changes</small>
                {show(pending.workingHours)}
              </dd>
            </div>
          )}

          {pending.bankDetails && (
            <div className={css.compareRow}>
              <dt>Payment details</dt>
              <dd>Published details are retained</dd>
              <dd>Payment changes submitted for review</dd>
            </div>
          )}

          {pending.documents && (
            <div className={css.compareRow}>
              <dt>Documents</dt>
              <dd>Current verification documents</dd>
              <dd>{pending.documents.length} submitted documents</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className={css.muted}>
          There are no submitted profile fields to compare.
        </p>
      )}
    </section>
  );
}

//===================================================================

export function Information({
  detail,
}: {
  detail: OwnedPharmacyDetailResponse;
}) {
  const { pharmacy, dates } = detail;

  return (
    <div className={css.infoStack}>
      <div className={css.identityGrid}>
        <section
          className={css.photoCard}
          aria-label="Published pharmacy photo"
        >
          <Photo url={pharmacy.imageUrl} name={pharmacy.name || 'Pharmacy'} />
        </section>

        <section
          className={css.sectionCard}
          aria-label="Published pharmacy details"
        >
          <dl className={css.details}>
            <Field label="Pharmacy status">
              <StatusBadge {...PHARMACY_STATUS_PRESENTATION[pharmacy.status]} />
            </Field>

            <Field label="Pharmacy ID">{pharmacy.id}</Field>

            <Field label="Phone">
              <Contact value={pharmacy.phone} type="phone" />
            </Field>

            <Field label="Email">
              <Contact value={pharmacy.email} type="email" />
            </Field>

            <Field label="Country code">
              {show(pharmacy.location?.countryCode)}
            </Field>

            <Field label="Region">{show(pharmacy.location?.region)}</Field>

            <Field label="Settlement">
              {show(pharmacy.location?.settlement)}
            </Field>

            <Field label="Pharmacy address">
              {show(pharmacy.location?.address)}
            </Field>

            <Field label="Created at">
              <DateValue value={dates.createdAt} />
            </Field>

            <Field label="Last edited">
              <DateValue value={dates.updatedAt} />
            </Field>
          </dl>
        </section>
      </div>

      <section className={css.sectionCard} aria-label="Pharmacy verification">
        <ProfileSectionHeader
          title="Verification and administrator feedback"
          description="Review progress, administrator decisions and requested corrections."
          icon={<ShieldCheck size={21} />}
        />

        <dl className={css.details}>
          <Field label="Submitted for verification">
            <DateValue value={dates.submittedAt} />
          </Field>

          <Field label="Approved at">
            <DateValue value={dates.approvedAt} />
          </Field>

          <Field label="Activated at">
            <DateValue value={dates.activatedAt} />
          </Field>

          <Field label="Review state">
            {pharmacy.reviewState === 'changes_requested'
              ? 'Changes requested'
              : pharmacy.reviewState === 'pending'
                ? 'Awaiting administrator review'
                : '—'}
          </Field>

          <Field label="Last reviewed">
            <DateValue value={pharmacy.reviewedAt} />
          </Field>

          <Field label="Administrator feedback">
            {show(pharmacy.reviewFeedback)}
          </Field>

          <Field label="Status reason">{show(pharmacy.statusReason)}</Field>
        </dl>
      </section>
      {pharmacy.pendingModeration ? (
        <PendingChanges
          pending={pharmacy.pendingModeration}
          pharmacy={pharmacy}
        />
      ) : null}
    </div>
  );
}
