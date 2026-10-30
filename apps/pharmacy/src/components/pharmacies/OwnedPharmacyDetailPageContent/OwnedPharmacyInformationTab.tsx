'use client';

import { useEffect, useState } from 'react';

import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type {
  OwnedPharmacyDetailResponse,
  PharmacyStatus,
} from '@e-pharmacy/types/pharmacies';

import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  getOwnedPharmacyLifecycleHistory,
  type LifecycleEvent,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import { show, DateValue, Field, Photo, Contact } from './detail-fields';
import { OwnedPharmacySalesChart } from './OwnedPharmacySalesChart';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

function HistoryStatus({
  status,
  fallback,
}: {
  status: string | null;
  fallback: string;
}) {
  if (
    status &&
    Object.prototype.hasOwnProperty.call(PHARMACY_STATUS_PRESENTATION, status)
  ) {
    return (
      <StatusBadge
        {...PHARMACY_STATUS_PRESENTATION[status as PharmacyStatus]}
      />
    );
  }

  return <span>{status?.replaceAll('_', ' ') ?? fallback}</span>;
}

//===================================================================

export function Information({
  detail,
}: {
  detail: OwnedPharmacyDetailResponse;
}) {
  const { pharmacy, dates } = detail;
  const [history, setHistory] = useState<LifecycleEvent[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMore, setHistoryMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let active = true;

    void getOwnedPharmacyLifecycleHistory(pharmacy.id, historyPage)
      .then(({ items, hasMore }) => {
        if (!active) return;

        setHistory((previous) =>
          historyPage === 1 ? items : [...previous, ...items]
        );

        setHistoryMore(hasMore);
      })

      .catch(() => {
        if (active) setHistoryMore(false);
      })

      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pharmacy.id, dates.updatedAt, historyPage]);

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
              <span className={css.statusWithReview}>
                <StatusBadge
                  {...PHARMACY_STATUS_PRESENTATION[pharmacy.status]}
                />

                {pharmacy.status === 'on_reactivation' &&
                pharmacy.reviewState === 'pending' ? (
                  <span className={css.needsChanges}>
                    Reactivation requested
                  </span>
                ) : null}
                {pharmacy.reviewState === 'changes_requested' &&
                (pharmacy.status === 'on_verification' ||
                  pharmacy.status === 'on_moderation' ||
                  pharmacy.status === 'on_reactivation') ? (
                  <span className={css.needsChanges}>Needs changes</span>
                ) : null}
              </span>
            </Field>

            {pharmacy.status === 'blocked' && pharmacy.statusReason ? (
              <Field label="Status reason">{show(pharmacy.statusReason)}</Field>
            ) : null}

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

      <section
        className={css.sectionCard}
        aria-label="Pharmacy status activity"
      >
        <h3 className={css.activityHeading}>Pharmacy status activity</h3>
        {history.length ? (
          <ol className={css.activityList}>
            {history.map((event) => (
              <li className={css.activityItem} key={event.id}>
                <div className={css.activityTitle}>
                  {event.action.replaceAll('.', ' ')}
                </div>

                <div className={css.activityTransition}>
                  <HistoryStatus
                    status={event.previousStatus}
                    fallback="Created"
                  />
                  <span aria-hidden="true">→</span>

                  <HistoryStatus status={event.nextStatus} fallback="Deleted" />
                </div>

                <div className={css.activityMeta}>
                  <span>{event.actor}</span>

                  <time dateTime={event.createdAt}>
                    {new Date(event.createdAt).toLocaleString('en-GB')}
                  </time>
                </div>
                {event.reason ? (
                  <p className={css.activityReason}>{event.reason}</p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className={css.activityEmpty}>
            No pharmacy status changes to display yet.
          </p>
        )}
        {historyMore ? (
          <Button
            variant="secondary"
            disabled={historyLoading}
            onClick={() => {
              setHistoryLoading(true);
              setHistoryPage((page) => page + 1);
            }}
          >
            {historyLoading ? 'Loading...' : 'Show older status changes'}
          </Button>
        ) : null}
      </section>

      <OwnedPharmacySalesChart
        pharmacyId={pharmacy.id}
        pharmacyStatus={pharmacy.status}
      />
    </div>
  );
}
