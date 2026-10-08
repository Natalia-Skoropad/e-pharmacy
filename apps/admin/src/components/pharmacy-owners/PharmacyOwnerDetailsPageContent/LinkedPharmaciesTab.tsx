'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import type { AdminPharmacyOwnerPharmaciesResponse } from '@e-pharmacy/types/admin';

import { CountLabel } from '@e-pharmacy/ui/data-display';
import { RowsPerPageSelect, type RowsPerPageValue } from '@e-pharmacy/ui/forms';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { FiltersButton } from '@e-pharmacy/ui/primitives';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { getAdminPharmacyOwnerPharmacies } from '@/lib/api/browser/admin-pharmacy-owners.api';

import {
  buildAdminPharmacyOwnerPharmaciesApiParams,
  buildAdminPharmacyOwnerPharmaciesUrl,
  type AdminPharmacyOwnerPharmaciesUrlState,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import { LinkedPharmaciesFiltersDrawer } from './LinkedPharmaciesFiltersDrawer';
import { LinkedPharmaciesTable } from './LinkedPharmaciesTable';
import { LinkedPharmacySearch } from './LinkedPharmacySearch';

import css from './PharmacyOwnerDetailsPageContent.module.css';

//===================================================================

type LinkedPharmaciesTabProps = Readonly<{
  ownerId: string;
  initialState: AdminPharmacyOwnerPharmaciesUrlState;
}>;

//===================================================================

function getPharmaciesErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return 'Linked pharmacies could not be loaded. Please try again.';
  }

  if (error.transportCode === 'NETWORK_ERROR') {
    return 'Could not reach the server. Check your connection and try again.';
  }

  if (error.transportCode === 'TIMEOUT') {
    return 'The request took too long. Please try again.';
  }

  if (error.transportCode === 'INVALID_RESPONSE') {
    return 'The server returned an unexpected linked pharmacies response. Refresh the data and try again.';
  }

  if (error.httpStatus === 403) {
    return 'You do not have permission to view linked pharmacies.';
  }

  if (error.httpStatus === 404) {
    return 'This pharmacy owner no longer exists.';
  }

  if (error.httpStatus && error.httpStatus >= 500) {
    return 'Linked pharmacies are temporarily unavailable. Please try again later.';
  }

  return 'Linked pharmacies could not be loaded. Please try again.';
}

//===================================================================

function getStateKey(state: AdminPharmacyOwnerPharmaciesUrlState): string {
  return [
    state.search,
    state.status,
    state.createdFrom,
    state.createdTo,
    state.rating,
    state.page,
    state.perPage,
  ].join('|');
}

//===================================================================

export function LinkedPharmaciesTab({
  ownerId,
  initialState,
}: LinkedPharmaciesTabProps) {
  const router = useRouter();
  const initialStateKey = getStateKey(initialState);

  const [optimisticNavigation, setOptimisticNavigation] = useState<Readonly<{
    fromKey: string;
    state: AdminPharmacyOwnerPharmaciesUrlState;
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
  const [reloadVersion, setReloadVersion] = useState(0);
  const requestKey = `${getStateKey(state)}|${reloadVersion}`;

  const [result, setResult] = useState<
    Readonly<{
      requestKey: string;
      data: AdminPharmacyOwnerPharmaciesResponse | null;
      error: string | null;
    }>
  >({ requestKey: '', data: null, error: null });

  const data = result.data;
  const isLoading = result.requestKey !== requestKey;
  const listError = result.requestKey === requestKey ? result.error : null;
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const navigate = useCallback(
    (nextState: AdminPharmacyOwnerPharmaciesUrlState) => {
      setOptimisticNavigation({
        fromKey: initialStateKey,
        state: nextState,
      });

      router.replace(buildAdminPharmacyOwnerPharmaciesUrl(ownerId, nextState), {
        scroll: false,
      });
    },
    [initialStateKey, ownerId, router]
  );

  useEffect(() => {
    const normalizedSearch = debouncedSearch.trim();
    if (normalizedSearch === state.search) return;

    router.replace(
      buildAdminPharmacyOwnerPharmaciesUrl(ownerId, {
        ...state,
        search: normalizedSearch,
        page: 1,
      }),
      { scroll: false }
    );
  }, [debouncedSearch, ownerId, router, state]);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequestKey = requestKey;

    void getAdminPharmacyOwnerPharmacies(
      ownerId,
      buildAdminPharmacyOwnerPharmaciesApiParams(state),
      { signal: controller.signal }
    )
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

        setResult({
          requestKey: currentRequestKey,
          data: response,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          requestKey: currentRequestKey,
          data: null,
          error: getPharmaciesErrorMessage(error),
        });
      });

    return () => controller.abort();
  }, [navigate, ownerId, requestKey, state]);

  const hasDateFilters = Boolean(state.createdFrom || state.createdTo);

  const hasActiveFilters = Boolean(
    state.search ||
    state.status !== 'all' ||
    state.rating !== 'all' ||
    hasDateFilters
  );

  const activeFiltersCount = [
    Boolean(state.search),
    state.status !== 'all',
    state.rating !== 'all',
    hasDateFilters,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchDraft(null);
    navigate({
      search: '',
      status: 'all',
      createdFrom: '',
      createdTo: '',
      rating: 'all',
      page: 1,
      perPage: state.perPage,
    });
  };

  const handleRowsPerPageChange = (perPage: RowsPerPageValue) => {
    navigate({ ...state, perPage, page: 1 });
  };

  return (
    <div className={css.linkedPharmaciesStack}>
      <section className={css.tabSectionCard}>
        <ProfileSectionHeader
          title="Linked pharmacies"
          titleId="owner-linked-pharmacies-title"
          description="Review every pharmacy linked to this owner and narrow the list by pharmacy details, status, rating, or creation date."
          icon={<Building2 size={22} />}
        />

        <div className={css.linkedPharmaciesSearchGrid}>
          <LinkedPharmacySearch
            ownerId={ownerId}
            value={searchInput}
            disabled={isLoading && !data}
            onChange={(value) =>
              setSearchDraft({ baseSearch: state.search, value })
            }
            onSelect={(pharmacy) => {
              setSearchDraft(null);
              navigate({ ...state, search: pharmacy.id, page: 1 });
            }}
          />

          <div className={css.linkedPharmaciesSearchAction}>
            <FiltersButton
              activeCount={activeFiltersCount}
              controlsId="owner-linked-pharmacies-filters-panel"
              isExpanded={isFiltersOpen}
              className={css.linkedPharmaciesFilterButton}
              onClick={() => setIsFiltersOpen(true)}
            />
          </div>
        </div>
      </section>

      <section
        className={css.tabSectionCard}
        aria-label="Linked pharmacies table"
      >
        <div className={css.linkedPharmaciesTableStack}>
          <div className={css.linkedPharmaciesToolbar}>
            <div className={css.linkedPharmaciesRowsControl}>
              <RowsPerPageSelect
                id="owner-linked-pharmacies-rows-per-page"
                value={state.perPage}
                disabled={isLoading && !data}
                onChange={handleRowsPerPageChange}
              />
            </div>

            {data && !listError ? (
              <CountLabel
                className={css.linkedPharmaciesCountLabel}
                shown={data.items.length}
                total={data.total}
                label="pharmacies"
                fullWidthOnMobile
              />
            ) : null}
          </div>

          {listError ? (
            <ProfileResourceState
              variant="error"
              title="Linked pharmacies could not be loaded"
              description={listError}
              retryLabel="Retry pharmacies"
              onRetry={() => setReloadVersion((version) => version + 1)}
            />
          ) : (
            <LinkedPharmaciesTable
              pharmacies={data?.items ?? []}
              isLoading={isLoading}
              emptyMessage={
                hasActiveFilters
                  ? 'No linked pharmacies match the selected filters.'
                  : 'No pharmacies are linked to this owner yet.'
              }
            />
          )}

          {data && !listError ? (
            <PaginationView
              currentPage={data.page}
              totalPages={data.totalPages}
              disabled={isLoading}
              ariaLabel="Linked pharmacies pagination"
              onPageChange={(page) => navigate({ ...state, page })}
            />
          ) : null}
        </div>
      </section>

      {isFiltersOpen ? (
        <LinkedPharmaciesFiltersDrawer
          state={state}
          hasActiveFilters={hasActiveFilters}
          onChange={navigate}
          onReset={resetFilters}
          onClose={() => setIsFiltersOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default LinkedPharmaciesTab;
