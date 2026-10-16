'use client';

import type { ReactNode } from 'react';

import {
  Building2,
  Clock3,
  ImageOff,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import {
  PHARMACY_STATUS_PRESENTATION,
  USER_STATUS_PRESENTATION,
} from '@e-pharmacy/config/presentation';

import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import { WorkingHours } from '@e-pharmacy/ui/data-display';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { CopyButton, TextActionButton } from '@e-pharmacy/ui/primitives';
import { useToast } from '@e-pharmacy/ui/feedback';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { getWorkingHoursDisplayItems } from '@e-pharmacy/validation/pharmacy';
import { formatDateTime } from '@e-pharmacy/utils/date';

import { buildAdminPharmacyOwnerDetailUrl } from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import {
  buildPharmacyComparisonRows,
  type PharmacyComparisonRow,
} from './pharmacy-information-comparison';

import { PharmacySalesChart } from './PharmacySalesChart';

import css from './PharmacyInformationTab.module.css';

//===================================================================

type Props = Readonly<{
  detail: AdminPharmacyDetail;
  canViewOwner: boolean;
}>;

//===================================================================

const display = (value: string | null | undefined) => value?.trim() || '—';

//===================================================================

function DateValue({ value }: { value?: string }) {
  if (!value) return <span>—</span>;

  return <time dateTime={value}>{formatDateTime(value) ?? '—'}</time>;
}

//===================================================================

function ContactValue({
  value,
  type,
  onCopy,
}: {
  value?: string;
  type: 'phone' | 'email';
  onCopy: (value: string, label: string) => void;
}) {
  if (!value?.trim()) return <span>—</span>;

  return (
    <span className={css.contactValue}>
      {type === 'email' ? (
        <Mail size={16} aria-hidden="true" />
      ) : (
        <Phone size={16} aria-hidden="true" />
      )}
      <a
        className={css.contactText}
        href={`${type === 'email' ? 'mailto' : 'tel'}:${value}`}
      >
        {value}
      </a>

      <CopyButton
        label={`Copy pharmacy ${type}: ${value}`}
        onClick={() => onCopy(value, type === 'email' ? 'Email' : 'Phone')}
      />
    </span>
  );
}

//===================================================================

function ScheduleValue({ value }: { value: string }) {
  if (value === '—') return <span>—</span>;

  if (!getWorkingHoursDisplayItems(value)?.length) {
    return <span>Schedule unavailable</span>;
  }

  return <WorkingHours value={value} className={css.hoursList} />;
}

//===================================================================

function Photo({
  url,
  name,
  compact = false,
}: {
  url?: string | null;
  name: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? css.smallPhoto : css.photo}>
      {url?.trim() ? (
        <ShimmerImage
          src={url}
          alt={name}
          className={css.coverImage}
          sizes={compact ? '160px' : '(max-width: 767px) 90vw, 400px'}
          unoptimized
        />
      ) : (
        <div className={css.photoPlaceholder}>
          <Building2 size={compact ? 27 : 62} aria-hidden="true" />
          <ImageOff size={compact ? 15 : 22} aria-hidden="true" />
          {!compact && <span>No pharmacy photo uploaded</span>}
        </div>
      )}
    </div>
  );
}

//===================================================================

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={css.detailField}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

//===================================================================

function ComparisonValue({
  row,
  value,
  isSubmitted,
}: {
  row: PharmacyComparisonRow;
  value: string;
  isSubmitted: boolean;
}) {
  if (row.presentation === 'image') {
    return (
      <Photo
        compact
        url={value === '—' ? undefined : value}
        name={
          isSubmitted ? 'Submitted pharmacy photo' : 'Published pharmacy photo'
        }
      />
    );
  }

  if (row.presentation === 'hours') return <ScheduleValue value={value} />;

  return <span className={css.comparisonText}>{value}</span>;
}

//===================================================================

/** Uses the existing detail response; opening this tab must not fetch another resource. */
export function PharmacyInformationTab({ detail, canViewOwner }: Props) {
  const { current, owner, dates } = detail;
  const comparison = buildPharmacyComparisonRows(detail);
  const toast = useToast();

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  return (
    <div className={css.tabContent}>
      <div className={css.identityGrid}>
        <section
          className={css.photoCard}
          aria-label="Published pharmacy photo"
        >
          <Photo url={current.imageUrl} name={current.name || 'Pharmacy'} />
        </section>

        <section
          className={css.sectionCard}
          aria-label="Published pharmacy details"
        >
          <dl className={`${css.detailsList} ${css.detailsTable}`}>
            <DetailField label="Pharmacy status">
              <StatusBadge {...PHARMACY_STATUS_PRESENTATION[detail.status]} />
            </DetailField>
            <DetailField label="Pharmacy ID">{detail.id}</DetailField>

            <DetailField label="Phone">
              <ContactValue
                type="phone"
                value={current.phone}
                onCopy={(value, label) => void copyValue(value, label)}
              />
            </DetailField>
            <DetailField label="Email">
              <ContactValue
                type="email"
                value={current.email}
                onCopy={(value, label) => void copyValue(value, label)}
              />
            </DetailField>

            <DetailField label="Country code">
              {display(current.location?.countryCode)}
            </DetailField>
            <DetailField label="Region">
              {display(current.location?.region)}
            </DetailField>

            <DetailField label="Settlement">
              {display(current.location?.settlement)}
            </DetailField>
            <DetailField label="Pharmacy address">
              {display(current.location?.address)}
            </DetailField>

            <DetailField label="Created at">
              <DateValue value={dates.createdAt} />
            </DetailField>
            <DetailField label="Last edited">
              <DateValue value={dates.updatedAt} />
            </DetailField>

            <div className={css.fullWidthField}>
              <DetailField label="Short pharmacy description">
                {display(current.shortDescription)}
              </DetailField>
            </div>
          </dl>
        </section>
      </div>

      <div className={css.secondaryGrid}>
        <section
          className={css.sectionCard}
          aria-labelledby="pharmacy-owner-title"
        >
          <div className={css.sectionHeading}>
            <UserRound size={20} aria-hidden="true" />
            <h3 id="pharmacy-owner-title">Pharmacy owner</h3>
          </div>
          {owner ? (
            <div className={css.ownerRow}>
              <div className={css.ownerPhoto}>
                {owner.pictureUrl ? (
                  <ShimmerImage
                    src={owner.pictureUrl}
                    alt={owner.name}
                    className={css.coverImage}
                    sizes="64px"
                    unoptimized
                  />
                ) : (
                  <UserRound size={30} aria-hidden="true" />
                )}
              </div>
              <div className={css.ownerDetails}>
                {canViewOwner ? (
                  <TextActionButton
                    href={buildAdminPharmacyOwnerDetailUrl(owner.id)}
                  >
                    {owner.name}
                  </TextActionButton>
                ) : (
                  <strong>{owner.name}</strong>
                )}
                <span className={css.ownerIdRow}>
                  <span className={css.muted}>ID: {owner.id}</span>
                  <StatusBadge {...USER_STATUS_PRESENTATION[owner.status]} />
                </span>
              </div>
            </div>
          ) : (
            <p className={css.muted}>
              No linked owner (legacy or incomplete pharmacy).
            </p>
          )}
        </section>
        <section
          className={css.sectionCard}
          aria-labelledby="pharmacy-hours-title"
        >
          <div className={css.sectionHeading}>
            <Clock3 size={20} aria-hidden="true" />
            <h3 id="pharmacy-hours-title">Published working hours</h3>
          </div>
          <ScheduleValue value={display(current.workingHours)} />
        </section>
      </div>

      <PharmacySalesChart pharmacyId={detail.id} />

      {detail.pendingChanges !== undefined && (
        <section
          className={css.sectionCard}
          aria-labelledby="pharmacy-comparison-title"
        >
          <div className={css.sectionHeading}>
            <ShieldCheck size={20} aria-hidden="true" />
            <h3 id="pharmacy-comparison-title">
              Published data / Submitted changes
            </h3>
          </div>

          <p className={css.muted}>
            Submitted changes are awaiting review. They are not approved and do
            not replace the published pharmacy profile.
          </p>

          {comparison.length ? (
            <dl className={css.comparisonList}>
              {comparison.map((row) => (
                <div
                  key={row.key}
                  className={
                    row.changed
                      ? css.comparisonChanged
                      : css.comparisonUnchanged
                  }
                >
                  <dt className={css.comparisonHeading}>
                    {row.label}
                    <span className={css.comparisonIndicator}>
                      {row.verificationRequired
                        ? 'Submitted · review documents'
                        : row.changed
                          ? 'Changed · not approved'
                          : 'Submitted · unchanged'}
                    </span>
                  </dt>
                  <dd className={css.comparisonColumns}>
                    <div>
                      <span className={css.columnLabel}>Published data</span>
                      <ComparisonValue
                        row={row}
                        value={row.published}
                        isSubmitted={false}
                      />
                    </div>

                    <div>
                      <span className={css.columnLabel}>Submitted changes</span>
                      <ComparisonValue
                        row={row}
                        value={row.submitted}
                        isSubmitted
                      />
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={css.muted}>
              There are no submitted profile fields to compare.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
