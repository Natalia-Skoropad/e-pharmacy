'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CirclePlus,
  Eye,
  Palette,
  PencilLine,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import {
  CountLabel,
  DataTable,
  formatInitials,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';
import {
  RowsPerPageSelect,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/forms';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { Button } from '@e-pharmacy/ui/primitives';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import {
  getAdminAuditActors,
  getAdminAuditLogDetails,
} from '@/lib/api/browser/admin-audit.api';
import { getAdminPharmacyOwnerActivity } from '@/lib/api/browser/admin-pharmacy-owners.api';
import type {
  AdminAuditActor,
  AdminAuditDetails,
  AdminAuditListResponse,
} from '@/lib/audit/admin-audit';
import {
  getAdminAuditActionLabel,
  getAdminAuditChangeTone,
  getAdminAuditStatusTransitionLabel,
} from '@/lib/audit/admin-audit-presentation';

import { ActivityActorIdentity } from '@/components/activity/ActivityActorIdentity';
import { AuditDetailsModal } from '@/components/activity/AuditDetailsModal';
import activityCss from '@/components/activity/ActivityHistory.module.css';

import css from './OwnerResourceTabs.module.css';

//===================================================================

function getErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return 'Activity history could not be loaded. Please try again.';
  }

  if (error.transportCode === 'NETWORK_ERROR') {
    return 'Could not reach the server. Check your connection and try again.';
  }

  if (error.transportCode === 'TIMEOUT') {
    return 'The request took too long. Please try again.';
  }

  if (error.httpStatus === 403) {
    return 'You do not have permission to view this activity history.';
  }

  return 'Activity history could not be loaded. Please try again.';
}

//===================================================================

function getChangeToneClassName(
  tone: ReturnType<typeof getAdminAuditChangeTone>
): string {
  if (tone === 'success') return activityCss.changeSuccess;
  if (tone === 'danger') return activityCss.changeDanger;
  if (tone === 'pending') return activityCss.changePending;
  if (tone === 'warning') return activityCss.changeWarning;
  if (tone === 'neutral') return activityCss.changeNeutral;
  return activityCss.changeInfo;
}

//===================================================================

type OwnerActivityTabProps = Readonly<{
  ownerId: string;
}>;

//===================================================================

export function OwnerActivityTab({ ownerId }: OwnerActivityTabProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<RowsPerPageValue>(20);
  const [data, setData] = useState<AdminAuditListResponse | null>(null);
  const [dataOwnerId, setDataOwnerId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [settledRequestKey, setSettledRequestKey] = useState<string | null>(null);

  const [actors, setActors] = useState<readonly AdminAuditActor[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [details, setDetails] = useState<AdminAuditDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsReloadVersion, setDetailsReloadVersion] = useState(0);

  const requestKey = `${ownerId}:${page}:${perPage}:${reloadVersion}`;
  const isLoading = settledRequestKey !== requestKey;
  const visibleData = dataOwnerId === ownerId ? data : null;
  const visibleListError =
    settledRequestKey === requestKey ? listError : null;

  useEffect(() => {
    const controller = new AbortController();

    void getAdminAuditActors({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setActors(response.items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setActors([]);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminPharmacyOwnerActivity(
      ownerId,
      { page, perPage },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        setData(response);
        setDataOwnerId(ownerId);
        setListError(null);
        setSettledRequestKey(requestKey);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setListError(getErrorMessage(error));
        setSettledRequestKey(requestKey);
      });

    return () => controller.abort();
  }, [ownerId, page, perPage, requestKey]);

  useEffect(() => {
    if (!selectedAuditId) return;

    const controller = new AbortController();

    void getAdminAuditLogDetails(selectedAuditId, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted) setDetails(response.auditLog);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setDetailsError(getErrorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsDetailsLoading(false);
      });

    return () => controller.abort();
  }, [detailsReloadVersion, selectedAuditId]);

  const actorById = useMemo(
    () => new Map(actors.map((actor) => [actor.id, actor] as const)),
    [actors]
  );

  const openDetails = useCallback((auditLogId: string) => {
    setDetails(null);
    setDetailsError(null);
    setIsDetailsLoading(true);
    setSelectedAuditId(auditLogId);
  }, []);

  const columns = useMemo<
    Array<DataTableColumn<AdminAuditListResponse['items'][number]>>
  >(
    () => [
      {
        key: 'createdAt',
        title: <TableHeaderTitle parts={['Date /', 'time']} />,
        render: (item) => <TableDateTime value={item.createdAt} />,
      },
      {
        key: 'photo',
        title: <TableHeaderTitle parts={['Profile', 'photo']} />,
        render: (item) => {
          const actor = actorById.get(item.actorUserId);

          return (
            <TableImagePreview
              src={actor?.pictureUrl}
              alt={`${item.actorNameSnapshot} photo`}
              fallback={formatInitials(item.actorNameSnapshot, 'A')}
            />
          );
        },
      },
      {
        key: 'actor',
        title: 'Changed by',
        render: (item) => (
          <ActivityActorIdentity
            actor={actorById.get(item.actorUserId)}
            actorNameSnapshot={item.actorNameSnapshot}
          />
        ),
      },
      {
        key: 'entity',
        title: 'Entity',
        render: (item) => <strong>{item.entityLabelSnapshot}</strong>,
      },
      {
        key: 'action',
        title: (
          <span className={activityCss.changeHeader}>
            Change
            <InfoTooltip
              label="Change color help"
              title="Change colors"
              icon={<Palette size={20} aria-hidden="true" />}
              escapeOverflow
              items={[
                {
                  title: 'Added',
                  description: 'Green marks newly created records and additions.',
                  icon: (
                    <CirclePlus
                      className={activityCss.legendSuccess}
                      size={17}
                      aria-hidden="true"
                    />
                  ),
                },
                {
                  title: 'Updated',
                  description: 'Yellow marks edits to existing records.',
                  icon: (
                    <PencilLine
                      className={activityCss.legendPending}
                      size={17}
                      aria-hidden="true"
                    />
                  ),
                },
                {
                  title: 'Deleted',
                  description: 'Red marks deleted or revoked records.',
                  icon: (
                    <Trash2
                      className={activityCss.legendDanger}
                      size={17}
                      aria-hidden="true"
                    />
                  ),
                },
                {
                  title: 'Status changes',
                  description: 'Status changes use the color of the resulting status.',
                  icon: <RefreshCw size={17} aria-hidden="true" />,
                },
              ]}
            />
          </span>
        ),
        render: (item) => {
          const tone = getAdminAuditChangeTone(item);
          const toneClassName = getChangeToneClassName(tone);
          const transition = getAdminAuditStatusTransitionLabel(item);

          return (
            <span className={activityCss.changeCell}>
              <strong className={`${activityCss.changeAction} ${toneClassName}`}>
                {getAdminAuditActionLabel(item.action)}
              </strong>
              {transition ? (
                <span
                  className={`${activityCss.changeTransition} ${toneClassName}`}
                >
                  {transition}
                </span>
              ) : null}
            </span>
          );
        },
      },
      {
        key: 'fields',
        title: <TableHeaderTitle parts={['Changed', 'fields']} />,
        render: (item) => (
          <span className={activityCss.changedFields}>
            {item.changedFields.join(', ')}
          </span>
        ),
      },
      {
        key: 'details',
        title: 'Actions',
        render: (item) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={activityCss.detailsButton}
            iconLeft={<Eye size={16} aria-hidden="true" />}
            onClick={() => openDetails(item.id)}
          >
            Details
          </Button>
        ),
      },
    ],
    [actorById, openDetails]
  );

  const retryList = () => {
    setListError(null);
    setReloadVersion((value) => value + 1);
  };

  return (
    <section className={css.resourceCard} aria-label="Pharmacy owner activity history">
      <div className={css.activityStack}>
        <div className={css.activityToolbar}>
          <RowsPerPageSelect
            id="owner-activity-rows-per-page"
            value={perPage}
            disabled={isLoading}
            onChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
          />

          {visibleData ? (
            <CountLabel
              className={css.activityCount}
              shown={visibleData.items.length}
              total={visibleData.total}
              label="records"
            />
          ) : null}
        </div>

        {!visibleData && visibleListError ? (
          <ProfileResourceState
            variant="error"
            title="Activity history could not be loaded"
            description={visibleListError}
            retryLabel="Try again"
            onRetry={retryList}
          />
        ) : (
          <>
            {visibleListError && visibleData ? (
              <div className={css.inlineError} role="alert">
                <span>{visibleListError}</span>
                <Button type="button" variant="secondary" size="sm" onClick={retryList}>
                  Retry
                </Button>
              </div>
            ) : null}

            <DataTable
              columns={columns}
              items={visibleData?.items ?? []}
              getItemKey={(item) => item.id}
              isLoading={isLoading}
              minWidth={0}
              ariaLabel="Pharmacy owner activity history"
              labels={{
                loading: visibleData
                  ? 'Refreshing owner activity history...'
                  : 'Loading owner activity history...',
                empty: 'Activity history is empty.',
              }}
            />

            {visibleData ? (
              <PaginationView
                currentPage={visibleData.page}
                totalPages={visibleData.totalPages}
                disabled={isLoading}
                ariaLabel="Pharmacy owner activity pagination"
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                }}
              />
            ) : null}
          </>
        )}
      </div>

      <AuditDetailsModal
        isOpen={selectedAuditId !== null}
        details={details}
        actor={details ? (actorById.get(details.actorUserId) ?? null) : null}
        isLoading={isDetailsLoading}
        error={detailsError}
        onClose={() => {
          setSelectedAuditId(null);
          setDetails(null);
          setDetailsError(null);
          setIsDetailsLoading(false);
        }}
        onRetry={() => {
          if (!selectedAuditId) return;
          setDetails(null);
          setDetailsError(null);
          setIsDetailsLoading(true);
          setDetailsReloadVersion((value) => value + 1);
        }}
      />
    </section>
  );
}
