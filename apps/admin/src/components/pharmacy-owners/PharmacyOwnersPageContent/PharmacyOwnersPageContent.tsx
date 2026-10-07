'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, ShieldCheck, UserRoundPlus, UsersRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { useDebouncedValue } from '@e-pharmacy/hooks/timing';

import type {
  AdminPharmacyOwnerListResponse,
  AdminPharmacyOwnerStatistics,
} from '@e-pharmacy/types/admin';

import { CountLabel } from '@e-pharmacy/ui/data-display';
import { RowsPerPageSelect, type RowsPerPageValue } from '@e-pharmacy/ui/forms';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';
import { StatsCard, StatsGrid } from '@e-pharmacy/ui/statistics';

import {
  getAdminPharmacyOwnerSummary,
  getAdminPharmacyOwners,
} from '@/lib/api/browser/admin-pharmacy-owners.api';

import {
  buildAdminPharmacyOwnerListApiParams,
  buildAdminPharmacyOwnersListUrl,
  type AdminPharmacyOwnersListUrlState,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import { PharmacyOwnerSearch } from '../PharmacyOwnerSearch/PharmacyOwnerSearch';
import { PharmacyOwnersFiltersDrawer } from '../PharmacyOwnersFiltersDrawer/PharmacyOwnersFiltersDrawer';
import { PharmacyOwnersTable } from '../PharmacyOwnersTable/PharmacyOwnersTable';

import css from './PharmacyOwnersPageContent.module.css';

//===================================================================

type PharmacyOwnersPageContentProps = Readonly<{
  initialState: AdminPharmacyOwnersListUrlState;
}>;

//===================================================================

function getOwnersErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return 'Pharmacy owners could not be loaded. Please try again.';
  }

  if (error.transportCode === 'NETWORK_ERROR') {
    return 'Could not reach the server. Check your connection and try again.';
  }

  if (error.transportCode === 'TIMEOUT') {
    return 'The request took too long. Please try again.';
  }

  if (error.transportCode === 'INVALID_RESPONSE') {
    return 'The server returned an unexpected pharmacy owners response. Refresh the data and try again.';
  }

  if (error.httpStatus === 403) {
    return 'You do not have permission to view pharmacy owners.';
  }

  if (error.httpStatus && error.httpStatus >= 500) {
    return 'Pharmacy owners are temporarily unavailable. Please try again later.';
  }

  return 'Pharmacy owners could not be loaded. Please try again.';
}

//===================================================================

function getSummaryErrorMessage(error: unknown): string {
  if (isApiError(error) && error.httpStatus === 403) {
    return 'You do not have permission to view owner statistics.';
  }

  return 'Owner status statistics are temporarily unavailable.';
}

//===================================================================

function getStateKey(state: AdminPharmacyOwnersListUrlState): string {
  return [
    state.search,
    state.status,
    state.registeredFrom,
    state.registeredTo,
    state.page,
    state.perPage,
  ].join('|');
}

//===================================================================

export function PharmacyOwnersPageContent({
  initialState,
}: PharmacyOwnersPageContentProps) {
  const router = useRouter();
  const initialStateKey = getStateKey(initialState);

  const [optimisticNavigation, setOptimisticNavigation] = useState<Readonly<{
    fromKey: string;
    state: AdminPharmacyOwnersListUrlState;
  }> | null>(null);

  const state =
    optimisticNavigation &&
    (optimisticNavigation.fromKey === initialStateKey ||
      getStateKey(optimisticNavigation.state) === initialStateKey)
      ? optimisticNavigation.state
      : initialState;

  const [searchDraft, setSearchDraft] = useState<Readonly<{
    baseSearch: string;
    value: string;
  }> | null>(null);

  const searchInput =
    searchDraft?.baseSearch === state.search ? searchDraft.value : state.search;

  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const [listReloadVersion, setListReloadVersion] = useState(0);
  const listRequestKey = `${getStateKey(state)}|${listReloadVersion}`;

  const [listResult, setListResult] = useState<
    Readonly<{
      requestKey: string;
      data: AdminPharmacyOwnerListResponse | null;
      error: string | null;
    }>
  >({ requestKey: '', data: null, error: null });

  const data = listResult.data;
  const isLoading = listResult.requestKey !== listRequestKey;

  const listError =
    listResult.requestKey === listRequestKey ? listResult.error : null;

  const [statisticsReloadVersion, setStatisticsReloadVersion] = useState(0);

  const [statisticsResult, setStatisticsResult] = useState<Readonly<{
    version: number;
    data: AdminPharmacyOwnerStatistics | null;
    error: string | null;
  }> | null>(null);

  const statistics =
    statisticsResult?.version === statisticsReloadVersion
      ? statisticsResult.data
      : null;

  const statisticsError =
    statisticsResult?.version === statisticsReloadVersion
      ? statisticsResult.error
      : null;

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const navigate = useCallback(
    (nextState: AdminPharmacyOwnersListUrlState) => {
      setOptimisticNavigation({
        fromKey: initialStateKey,
        state: nextState,
      });

      router.replace(buildAdminPharmacyOwnersListUrl(nextState), {
        scroll: false,
      });
    },
    [initialStateKey, router]
  );

  useEffect(() => {
    const normalizedSearch = debouncedSearch.trim();
    if (normalizedSearch === state.search) return;

    router.replace(
      buildAdminPharmacyOwnersListUrl({
        ...state,
        search: normalizedSearch,
        page: 1,
      }),
      { scroll: false }
    );
  }, [debouncedSearch, router, state]);

  useEffect(() => {
    const controller = new AbortController();
    const requestKey = listRequestKey;

    void getAdminPharmacyOwners(buildAdminPharmacyOwnerListApiParams(state), {
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;

        if (
          state.page > 1 &&
          (response.totalPages === 0 || state.page > response.totalPages)
        ) {
          navigate({
            ...state,
            page: Math.max(1, response.totalPages),
          });
          return;
        }

        setListResult({ requestKey, data: response, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setListResult({
          requestKey,
          data: null,
          error: getOwnersErrorMessage(error),
        });
      });

    return () => controller.abort();
  }, [listRequestKey, navigate, state]);

  useEffect(() => {
    const controller = new AbortController();
    const version = statisticsReloadVersion;

    void getAdminPharmacyOwnerSummary({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) {
          setStatisticsResult({ version, data: response, error: null });
        }
      })

      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setStatisticsResult({
            version,
            data: null,
            error: getSummaryErrorMessage(error),
          });
        }
      });

    return () => controller.abort();
  }, [statisticsReloadVersion]);

  const hasDateFilters = Boolean(state.registeredFrom || state.registeredTo);

  const hasActiveFilters = Boolean(
    state.search || state.status !== 'all' || hasDateFilters
  );

  const activeFiltersCount = [
    Boolean(state.search),
    state.status !== 'all',
    hasDateFilters,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchDraft(null);
    navigate({
      search: '',
      status: 'all',
      registeredFrom: '',
      registeredTo: '',
      page: 1,
      perPage: state.perPage,
    });
  };

  const handleRowsPerPageChange = (perPage: RowsPerPageValue) => {
    navigate({ ...state, perPage, page: 1 });
  };

  const analytics = useMemo(
    () => [
      {
        key: 'all' as const,
        title: 'All owners',
        value: statistics?.all,
        tone: 'accent' as const,
        icon: <UsersRound size={26} aria-hidden="true" />,
        status: 'all' as const,
      },
      {
        key: 'new' as const,
        title: 'New',
        value: statistics?.new,
        tone: 'blue' as const,
        icon: <UserRoundPlus size={26} aria-hidden="true" />,
        status: 'new' as const,
      },
      {
        key: 'active' as const,
        title: 'Active',
        value: statistics?.active,
        tone: 'green' as const,
        icon: <ShieldCheck size={26} aria-hidden="true" />,
        status: 'active' as const,
      },
      {
        key: 'blocked' as const,
        title: 'Blocked',
        value: statistics?.blocked,
        tone: 'red' as const,
        icon: <Ban size={26} aria-hidden="true" />,
        status: 'blocked' as const,
      },
    ],
    [statistics]
  );

  return (
    <main className={css.page} aria-labelledby="pharmacy-owners-page-title">
      <section
        className={css.card}
        aria-labelledby="pharmacy-owners-page-title"
      >
        <PageHeader
          title={
            <span className={css.titleWithHelp}>
              Pharmacy Owners
              <InfoTooltip
                label="About Pharmacy Owners"
                title="Pharmacy Owners"
                items={[
                  {
                    title: 'New',
                    description:
                      'A newly registered owner whose first pharmacy has not been activated yet.',
                  },
                  {
                    title: 'Active',
                    description:
                      'An owner with active access to the pharmacy cabinet. Owner status is separate from each pharmacy moderation status.',
                  },
                  {
                    title: 'Blocked',
                    description:
                      'An owner whose account access has been deactivated by Admin.',
                  },
                ]}
              />
            </span>
          }
          titleId="pharmacy-owners-page-title"
          icon={<UsersRound size={23} aria-hidden="true" />}
        />

        {statistics ? (
          <StatsGrid
            className={css.statistics}
            columns={4}
            tabletColumns={2}
            ariaLabel="Pharmacy owner status statistics"
          >
            {analytics.map((item) => (
              <StatsCard
                key={item.key}
                title={item.title}
                value={item.value ?? 0}
                tone={item.tone}
                icon={item.icon}
                href={buildAdminPharmacyOwnersListUrl({
                  ...state,
                  status: item.status,
                  page: 1,
                })}
                ariaLabel={`Filter pharmacy owners by ${item.title.toLowerCase()}`}
              />
            ))}
          </StatsGrid>
        ) : statisticsError ? (
          <div className={css.statisticsError} role="alert">
            <p>{statisticsError}</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                setStatisticsReloadVersion((version) => version + 1)
              }
            >
              Retry statistics
            </Button>
          </div>
        ) : (
          <p className={css.statisticsState} role="status">
            Loading owner status statistics...
          </p>
        )}
      </section>

      <section
        className={css.card}
        aria-labelledby="pharmacy-owners-search-title"
      >
        <h2 className={css.visuallyHidden} id="pharmacy-owners-search-title">
          Pharmacy owners search and filters
        </h2>

        <div className={css.searchGrid}>
          <PharmacyOwnerSearch
            value={searchInput}
            disabled={isLoading && !data}
            onChange={(value) =>
              setSearchDraft({ baseSearch: state.search, value })
            }
            onSelect={(owner) => {
              setSearchDraft(null);
              navigate({ ...state, search: owner.id, page: 1 });
            }}
          />

          <div className={css.searchAction}>
            <FiltersButton
              activeCount={activeFiltersCount}
              controlsId="pharmacy-owners-filters-panel"
              isExpanded={isFiltersOpen}
              className={css.filterButton}
              onClick={() => setIsFiltersOpen(true)}
            />
          </div>
        </div>
      </section>

      <section className={css.card} aria-label="Pharmacy owners table">
        <div className={css.toolbar}>
          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="pharmacy-owners-rows-per-page"
              value={state.perPage}
              disabled={isLoading && !data}
              onChange={handleRowsPerPageChange}
            />
          </div>

          {data && !listError ? (
            <CountLabel
              className={css.countLabel}
              shown={data.items.length}
              total={data.total}
              label="owners"
              fullWidthOnMobile
            />
          ) : null}
        </div>

        {listError ? (
          <div className={css.inlineError} role="alert">
            <p>{listError}</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setListReloadVersion((version) => version + 1)}
            >
              Retry owners
            </Button>
          </div>
        ) : (
          <PharmacyOwnersTable
            owners={data?.items ?? []}
            isLoading={isLoading}
            emptyMessage={
              hasActiveFilters
                ? 'No pharmacy owners match the selected filters.'
                : 'No pharmacy owners have registered yet.'
            }
          />
        )}

        {data && !listError ? (
          <PaginationView
            currentPage={data.page}
            totalPages={data.totalPages}
            disabled={isLoading}
            ariaLabel="Pharmacy owners pagination"
            onPageChange={(page) => navigate({ ...state, page })}
          />
        ) : null}
      </section>

      {isFiltersOpen ? (
        <PharmacyOwnersFiltersDrawer
          state={state}
          hasActiveFilters={hasActiveFilters}
          onChange={navigate}
          onReset={resetFilters}
          onClose={() => setIsFiltersOpen(false)}
        />
      ) : null}
    </main>
  );
}

export default PharmacyOwnersPageContent;
