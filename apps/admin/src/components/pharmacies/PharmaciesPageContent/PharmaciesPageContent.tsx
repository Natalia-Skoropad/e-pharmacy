'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Ban,
  Building2,
  ClipboardCheck,
  Clock3,
  ShieldCheck,
  Store,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type {
  AdminPharmacyListItem,
  AdminPharmacyListResponse,
  AdminPharmacyStatistics,
} from '@e-pharmacy/types/admin';

import {
  DataTable,
  TableDateTime,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { PageHeader } from '@e-pharmacy/ui/layout';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';

import {
  StatsCard,
  StatsGrid,
  StatsLoadingSkeleton,
  StatusBadge,
} from '@e-pharmacy/ui/statistics';

import {
  getAdminPharmacies,
  getAdminPharmacySummary,
} from '@/lib/api/browser/admin-pharmacy-registry.api';

import {
  buildAdminPharmaciesListApiParams,
  buildAdminPharmaciesListUrl,
  type AdminPharmacyListUrlState,
} from '@/lib/pharmacies/admin-pharmacy-url';

import { buildAdminPharmacyOwnerDetailUrl } from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

// Reuse the Owners registry shell classes: no parallel container CSS.
import shellCss from '@/components/pharmacy-owners/PharmacyOwnersPageContent/PharmacyOwnersPageContent.module.css';
import css from './PharmaciesPageContent.module.css';

//===================================================================

type PharmaciesPageContentProps = Readonly<{
  initialState: AdminPharmacyListUrlState;
}>;

type StatusKey = Exclude<AdminPharmacyListUrlState['status'], 'all'>;

//===================================================================

function getListErrorMessage(error: unknown): string {
  if (!isApiError(error))
    return 'Pharmacies could not be loaded. Please try again.';
  if (error.transportCode === 'NETWORK_ERROR')
    return 'Could not reach the server. Check your connection and try again.';
  if (error.transportCode === 'TIMEOUT')
    return 'The request took too long. Please try again.';
  if (error.transportCode === 'INVALID_RESPONSE')
    return 'The server returned an unexpected pharmacies response. Refresh the data and try again.';
  if (error.httpStatus === 403)
    return 'You do not have permission to view pharmacies.';
  if (error.httpStatus && error.httpStatus >= 500)
    return 'Pharmacies are temporarily unavailable. Please try again later.';
  return 'Pharmacies could not be loaded. Please try again.';
}

//===================================================================

function getStatsErrorMessage(error: unknown): string {
  if (isApiError(error) && error.httpStatus === 403)
    return 'You do not have permission to view pharmacy statistics.';

  return 'Pharmacy status statistics are temporarily unavailable.';
}

//===================================================================

function getListKey(state: AdminPharmacyListUrlState): string {
  return buildAdminPharmaciesListUrl(state);
}

//===================================================================

export function PharmaciesPageContent({
  initialState,
}: PharmaciesPageContentProps) {
  const router = useRouter();
  const [listRetry, setListRetry] = useState(0);
  const [statsRetry, setStatsRetry] = useState(0);

  const listKey = `${getListKey(initialState)}|${listRetry}`;

  const [listResult, setListResult] = useState<
    Readonly<{
      key: string;
      data: AdminPharmacyListResponse | null;
      error: string | null;
    }>
  >({ key: '', data: null, error: null });

  const [statsResult, setStatsResult] = useState<Readonly<{
    retry: number;
    data: AdminPharmacyStatistics | null;
    error: string | null;
  }> | null>(null);

  const isLoadingList = listResult.key !== listKey;
  const data = isLoadingList ? null : listResult.data;
  const listError = isLoadingList ? null : listResult.error;

  const statistics =
    statsResult?.retry === statsRetry ? statsResult.data : null;

  const statsError =
    statsResult?.retry === statsRetry ? statsResult.error : null;

  // Registry rows and global totals are independent requests. A failure in one
  // must never suppress the other, and stale/aborted pages cannot overwrite new ones.
  useEffect(() => {
    const controller = new AbortController();
    const key = listKey;
    const state = initialState;

    void getAdminPharmacies(buildAdminPharmaciesListApiParams(state), {
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;

        if (state.page > 1 && state.page > Math.max(1, response.totalPages)) {
          router.replace(
            buildAdminPharmaciesListUrl({
              ...state,
              page: Math.max(1, response.totalPages),
            }),
            { scroll: false }
          );
          return;
        }

        setListResult({ key, data: response, error: null });
      })

      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setListResult({ key, data: null, error: getListErrorMessage(error) });
      });

    return () => controller.abort();
  }, [listKey, initialState, router]);

  useEffect(() => {
    const controller = new AbortController();
    const retry = statsRetry;

    void getAdminPharmacySummary({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted)
          setStatsResult({ retry, data: response, error: null });
      })

      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setStatsResult({
            retry,
            data: null,
            error: getStatsErrorMessage(error),
          });
      });

    return () => controller.abort();
  }, [statsRetry]);

  const cards = useMemo(
    () => [
      {
        key: 'new' as StatusKey,
        title: 'New',
        value: statistics?.new ?? 0,
        tone: 'blue' as const,
        icon: <Store size={26} aria-hidden="true" />,
      },
      {
        key: 'on_verification' as StatusKey,
        title: 'On verification',
        value: statistics?.onVerification ?? 0,
        tone: 'orange' as const,
        icon: <ClipboardCheck size={26} aria-hidden="true" />,
      },
      {
        key: 'active' as StatusKey,
        title: 'Active',
        value: statistics?.active ?? 0,
        tone: 'green' as const,
        icon: <ShieldCheck size={26} aria-hidden="true" />,
      },
      {
        key: 'on_moderation' as StatusKey,
        title: 'On moderation',
        value: statistics?.onModeration ?? 0,
        tone: 'purple' as const,
        icon: <Clock3 size={26} aria-hidden="true" />,
      },
      {
        key: 'blocked' as StatusKey,
        title: 'Blocked',
        value: statistics?.blocked ?? 0,
        tone: 'red' as const,
        icon: <Ban size={26} aria-hidden="true" />,
      },
    ],
    [statistics]
  );

  // Stage 14.9 offers real filtered registry rows. The full 13-column table,
  // search and drawer controls are intentionally reserved for Stage 14.10.
  const columns = useMemo<Array<DataTableColumn<AdminPharmacyListItem>>>(
    () => [
      {
        key: 'createdAt',
        title: 'Created date',
        render: (pharmacy) => <TableDateTime value={pharmacy.createdAt} />,
      },
      {
        key: 'name',
        title: 'Pharmacy',
        render: (pharmacy) => pharmacy.name || '—',
      },
      {
        key: 'owner',
        title: 'Pharmacy owner',
        render: (pharmacy) =>
          pharmacy.owner ? (
            <TextActionButton
              href={buildAdminPharmacyOwnerDetailUrl(pharmacy.owner.id)}
            >
              {pharmacy.owner.name}
            </TextActionButton>
          ) : (
            '—'
          ),
      },
      {
        key: 'status',
        title: 'Pharmacy status',
        render: (pharmacy) => (
          <StatusBadge {...PHARMACY_STATUS_PRESENTATION[pharmacy.status]} />
        ),
      },
    ],
    []
  );

  return (
    <main className={shellCss.page} aria-labelledby="pharmacies-page-title">
      <section
        className={shellCss.card}
        aria-labelledby="pharmacies-page-title"
      >
        <PageHeader
          title={
            <span className={shellCss.titleWithHelp}>
              Pharmacies
              <InfoTooltip
                label="About Pharmacies"
                title="Pharmacies"
                icon={<Building2 size={20} aria-hidden="true" />}
                items={[
                  {
                    title: 'New',
                    description:
                      'A pharmacy draft that has not yet been submitted for verification.',
                    icon: <Store size={17} aria-hidden="true" />,
                  },
                  {
                    title: 'On verification',
                    description:
                      'A new pharmacy undergoing its first review before publication.',
                    icon: <ClipboardCheck size={17} aria-hidden="true" />,
                  },
                  {
                    title: 'Active',
                    description: 'An approved pharmacy available to clients.',
                    icon: <ShieldCheck size={17} aria-hidden="true" />,
                  },
                  {
                    title: 'On moderation',
                    description:
                      'An already activated pharmacy with changes under review. Previously approved data can remain public and operational.',
                    icon: <Clock3 size={17} aria-hidden="true" />,
                  },
                  {
                    title: 'Blocked',
                    description:
                      'A pharmacy blocked from operating. Status decisions are managed from its detail view.',
                    icon: <Ban size={17} aria-hidden="true" />,
                  },
                  {
                    title: 'Registry metrics',
                    description:
                      'Cards show global pharmacy counts, independent of list filters. Successful orders and revenue in the full registry table count only successfully completed orders.',
                    icon: <Building2 size={17} aria-hidden="true" />,
                  },
                ]}
              />
            </span>
          }
          titleId="pharmacies-page-title"
          icon={<Building2 size={23} aria-hidden="true" />}
        />

        <div className={`${shellCss.statisticsBlock} ${css.statsVisible}`}>
          {statistics ? (
            <StatsGrid
              className={shellCss.statistics}
              columns={5}
              tabletColumns={2}
              ariaLabel="Pharmacy status statistics"
            >
              {cards.map((card) => {
                const active = initialState.status === card.key;
                const target = active ? 'all' : card.key;

                return (
                  <StatsCard
                    key={card.key}
                    title={card.title}
                    value={card.value}
                    tone={card.tone}
                    icon={card.icon}
                    className={active ? css.activeCard : undefined}
                    href={buildAdminPharmaciesListUrl({
                      ...initialState,
                      status: target,
                      page: 1,
                    })}
                    ariaLabel={
                      active
                        ? `Clear ${card.title.toLowerCase()} pharmacy status filter`
                        : `Filter pharmacies by ${card.title.toLowerCase()}`
                    }
                  />
                );
              })}
            </StatsGrid>
          ) : statsError ? (
            <div className={shellCss.statisticsError} role="alert">
              <p>{statsError}</p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setStatsRetry((retry) => retry + 1)}
              >
                Retry statistics
              </Button>
            </div>
          ) : (
            <StatsLoadingSkeleton
              count={5}
              columns={5}
              tabletColumns={2}
              label="Loading pharmacy status statistics"
            />
          )}
        </div>
      </section>

      <section className={shellCss.card} aria-label="Pharmacies list">
        <div className={css.listHeading}>
          <h2>Pharmacy list</h2>
          <p className={css.filterDescription} role="status">
            {initialState.status === 'all'
              ? 'All pharmacy statuses'
              : `Status: ${PHARMACY_STATUS_PRESENTATION[initialState.status].label}`}
          </p>
        </div>
        {listError ? (
          <ProfileResourceState
            variant="error"
            title="Pharmacies could not be loaded"
            description={listError}
            retryLabel="Try again"
            sideActionOnDesktop
            onRetry={() => setListRetry((retry) => retry + 1)}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              items={data?.items ?? []}
              getItemKey={(pharmacy) => pharmacy.id}
              isLoading={isLoadingList}
              minWidth={760}
              ariaLabel="Pharmacies"
              labels={{
                loading: 'Loading pharmacies...',
                empty:
                  initialState.status === 'all'
                    ? 'No pharmacies have registered yet.'
                    : 'No pharmacies match the selected status.',
              }}
            />
            {data && data.totalPages > 1 ? (
              <PaginationView
                currentPage={data.page}
                totalPages={data.totalPages}
                disabled={isLoadingList}
                ariaLabel="Pharmacies pagination"
                onPageChange={(page) =>
                  router.replace(
                    buildAdminPharmaciesListUrl({ ...initialState, page }),
                    { scroll: false }
                  )
                }
              />
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

export default PharmaciesPageContent;
