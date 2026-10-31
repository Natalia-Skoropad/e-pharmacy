'use client';

import { useEffect, useState } from 'react';

import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

import { Button } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import {
  getOwnedPharmacyLifecycleHistory,
  type LifecycleEvent,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

function LifecycleBadge({ status }: { status: string | null }) {
  if (!status) return <span>Created</span>;

  if (
    Object.prototype.hasOwnProperty.call(PHARMACY_STATUS_PRESENTATION, status)
  ) {
    return (
      <StatusBadge
        {...PHARMACY_STATUS_PRESENTATION[status as PharmacyStatus]}
      />
    );
  }

  return <span>{status.replaceAll('_', ' ')}</span>;
}

//===================================================================

/** Complete owner-visible lifecycle history, separate from the last event on the overview. */
export function OwnedPharmacyActivityTab({
  pharmacyId,
}: {
  pharmacyId: string;
}) {
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [history, setHistory] = useState<LifecycleEvent[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    void getOwnedPharmacyLifecycleHistory(pharmacyId, page)
      .then((result) => {
        if (!active) return;

        setHistory((previous) =>
          page === 1
            ? result.items
            : [
                ...previous,
                ...result.items.filter(
                  (item) => !previous.some((entry) => entry.id === item.id)
                ),
              ]
        );
        setHasMore(result.hasMore);
        setFailed(false);
      })

      .catch(() => {
        if (active) setFailed(true);
      })

      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pharmacyId, page, version]);

  if (isLoading && history.length === 0) {
    return (
      <ProfileResourceState
        variant="loading"
        title="Loading pharmacy activity"
        description="Loading the pharmacy's status history."
      />
    );
  }

  if (failed && history.length === 0) {
    return (
      <ProfileResourceState
        variant="error"
        title="Pharmacy activity could not be loaded"
        description="Please try again."
        retryLabel="Retry activity"
        onRetry={() => {
          setIsLoading(true);
          setVersion((v) => v + 1);
        }}
      />
    );
  }

  return (
    <section
      className={css.sectionCard}
      aria-label="Full pharmacy status activity"
    >
      <h3 className={css.activityHeading}>Pharmacy status history</h3>
      {history.length ? (
        <ol className={css.activityList}>
          {history.map((entry) => (
            <li className={css.activityItem} key={entry.id}>
              <div className={css.activityTitle}>
                {entry.action.replaceAll('.', ' ')}
              </div>

              <div className={css.activityTransition}>
                <LifecycleBadge status={entry.previousStatus} />
                <span aria-hidden="true">→</span>
                <LifecycleBadge status={entry.nextStatus} />
              </div>

              <div className={css.activityMeta}>
                <span>{entry.actor}</span>
                <time dateTime={entry.createdAt}>
                  {new Date(entry.createdAt).toLocaleString('en-GB')}
                </time>
              </div>

              {entry.reason ? (
                <p className={css.activityReason}>{entry.reason}</p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className={css.activityEmpty}>No pharmacy status changes yet.</p>
      )}
      {failed ? (
        <Button
          variant="secondary"
          onClick={() => {
            setIsLoading(true);
            setVersion((v) => v + 1);
          }}
        >
          Retry activity
        </Button>
      ) : null}
      {!failed && hasMore ? (
        <Button
          variant="secondary"
          disabled={isLoading}
          onClick={() => {
            setIsLoading(true);
            setPage((p) => p + 1);
          }}
        >
          {isLoading ? 'Loading...' : 'Show older status changes'}
        </Button>
      ) : null}
    </section>
  );
}
