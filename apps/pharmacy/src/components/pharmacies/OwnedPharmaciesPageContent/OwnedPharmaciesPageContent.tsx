'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Ban,
  Building2,
  ClipboardCheck,
  Clock3,
  ShieldCheck,
  Store,
  Plus,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { useAuth } from '@e-pharmacy/auth/react';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type {
  OwnedPharmacyListItem,
  OwnedPharmacyListResponse,
  OwnedPharmacyStatistics,
} from '@e-pharmacy/types/pharmacies';

import {
  CountLabel,
  DataTable,
  formatInitials,
  RatingSummary,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { RowsPerPageSelect, type RowsPerPageValue } from '@e-pharmacy/ui/forms';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { InfoTooltip, OrderMetricsTooltip } from '@e-pharmacy/ui/overlays';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import {
  Button,
  FiltersButton,
  TextActionButton,
} from '@e-pharmacy/ui/primitives';

import {
  StatsCard,
  StatsGrid,
  StatsLoadingSkeleton,
  StatusBadge,
} from '@e-pharmacy/ui/statistics';

import { formatAmount } from '@e-pharmacy/utils/money';

import {
  getOwnedPharmacies,
  getOwnedPharmacyStatistics,
  getOwnedPharmacyMemberships,
} from '@/lib/api/browser/owned-pharmacy-registry.api';

import {
  buildOwnedPharmaciesListApiParams,
  buildOwnedPharmaciesListUrl,
  buildOwnedPharmacyDetailUrl,
  type OwnedPharmacyListUrlState,
} from '@/lib/pharmacies/owned-pharmacy-url';

import { getOwnedPharmacyLocationFilterOptions } from '@/lib/pharmacies/owned-pharmacy-location-options';
import { PHARMACY_ROUTES } from '@/lib/routes';

import { OwnedPharmacySearch } from '../OwnedPharmacySearch/OwnedPharmacySearch';
import { OwnedPharmaciesFiltersDrawer } from '../OwnedPharmaciesFiltersDrawer/OwnedPharmaciesFiltersDrawer';

import css from './OwnedPharmaciesPageContent.module.css';

//===================================================================

type OwnedPharmaciesPageContentProps = Readonly<{
  initialState: OwnedPharmacyListUrlState;
}>;

type StatusKey = Exclude<OwnedPharmacyListUrlState['status'], 'all'>;

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

function getListKey(state: OwnedPharmacyListUrlState): string {
  return buildOwnedPharmaciesListUrl(state);
}

//===================================================================

export function OwnedPharmaciesPageContent({
  initialState,
}: OwnedPharmaciesPageContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [canCreate, setCanCreate] = useState(false);
  const [membershipReady, setMembershipReady] = useState(false);
  const state = initialState;
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const navigate = useCallback(
    (nextState: OwnedPharmacyListUrlState) => {
      router.replace(buildOwnedPharmaciesListUrl(nextState), { scroll: false });
    },
    [router]
  );

  const [listRetry, setListRetry] = useState(0);
  const [statsRetry, setStatsRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getOwnedPharmacyMemberships({ signal: controller.signal })
      .then((pharmacies) => {
        if (controller.signal.aborted) return;

        setCanCreate(
          pharmacies.length === 0 ||
            pharmacies.some((pharmacy) => pharmacy.membershipRole === 'owner')
        );

        setMembershipReady(true);
      })

      .catch(() => {
        if (!controller.signal.aborted) setMembershipReady(false);
      });

    return () => controller.abort();
  }, []);

  const listKey = `${getListKey(state)}|${listRetry}`;

  const [listResult, setListResult] = useState<
    Readonly<{
      key: string;
      data: OwnedPharmacyListResponse | null;
      error: string | null;
    }>
  >({ key: '', data: null, error: null });

  const [statsResult, setStatsResult] = useState<Readonly<{
    retry: number;
    data: OwnedPharmacyStatistics | null;
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

    void getOwnedPharmacies(buildOwnedPharmaciesListApiParams(state), {
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;

        if (state.page > 1 && state.page > Math.max(1, response.totalPages)) {
          navigate({ ...state, page: Math.max(1, response.totalPages) });
          return;
        }

        setListResult({ key, data: response, error: null });
      })

      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setListResult({ key, data: null, error: getListErrorMessage(error) });
      });

    return () => controller.abort();
  }, [listKey, navigate, state]);

  useEffect(() => {
    const controller = new AbortController();
    const retry = statsRetry;

    void getOwnedPharmacyStatistics({ signal: controller.signal })
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

  const hasActiveFilters = Boolean(
    state.pharmacyId ||
    state.settlement ||
    state.region ||
    state.status !== 'all' ||
    state.createdFrom ||
    state.createdTo ||
    state.rating !== 'all'
  );

  const activeFiltersCount = [
    Boolean(state.pharmacyId),
    Boolean(state.settlement),
    Boolean(state.region),
    Boolean(state.createdFrom || state.createdTo),
    state.status !== 'all',
    state.rating !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () =>
    navigate({
      pharmacyId: '',
      settlement: '',
      region: '',
      status: 'all',
      createdFrom: '',
      createdTo: '',
      rating: 'all',
      sort: 'created_desc',
      page: 1,
      perPage: state.perPage,
    });

  const changeRowsPerPage = (perPage: RowsPerPageValue) =>
    navigate({ ...state, perPage, page: 1 });

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
        tone: 'purple' as const,
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
        tone: 'orange' as const,
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

  // The same server aggregation used by Owner > Linked pharmacies supplies
  // all row metrics; no per-row client requests or inferred counters.
  const columns = useMemo<Array<DataTableColumn<OwnedPharmacyListItem>>>(
    () => [
      {
        key: 'createdAt',
        title: <TableHeaderTitle parts={['Created', 'date']} />,
        render: (pharmacy) => <TableDateTime value={pharmacy.createdAt} />,
      },
      {
        key: 'photo',
        title: <TableHeaderTitle parts={['Pharmacy', 'photo']} />,

        render: (pharmacy) => (
          <TableImagePreview
            src={pharmacy.imageUrl}
            alt={`${pharmacy.name || 'Pharmacy'} photo`}
            fallback={formatInitials(pharmacy.name || 'Pharmacy', 'P')}
          />
        ),
      },
      {
        key: 'id',
        title: <TableHeaderTitle parts={['Pharmacy', 'ID']} />,

        render: (pharmacy) => (
          <TextActionButton
            className={css.breakableLink}
            href={buildOwnedPharmacyDetailUrl(pharmacy.id)}
          >
            {pharmacy.id}
          </TextActionButton>
        ),
      },
      {
        key: 'name',
        title: <TableHeaderTitle parts={['Pharmacy', 'name']} />,

        render: (pharmacy) => (
          <TextActionButton href={buildOwnedPharmacyDetailUrl(pharmacy.id)}>
            {pharmacy.name || 'Unnamed pharmacy'}
          </TextActionButton>
        ),
      },
      {
        key: 'addedProductsCount',
        title: <TableHeaderTitle parts={['Added', 'products']} />,
        render: (pharmacy) => pharmacy.addedProductsCount ?? '—',
      },
      {
        key: 'activeClientsCount',
        title: <TableHeaderTitle parts={['Active', 'clients']} />,
        render: (pharmacy) => pharmacy.activeClientsCount ?? '—',
      },
      {
        key: 'successfulOrdersCount',

        title: (
          <span className={css.headerWithHelp}>
            <TableHeaderTitle parts={['Orders', 'count']} />
            <OrderMetricsTooltip scope="pharmacy" preferTopLayer />
          </span>
        ),

        render: (pharmacy) => pharmacy.successfulOrdersCount ?? '—',
      },
      {
        key: 'successfulRevenue',
        title: <TableHeaderTitle parts={['Orders', 'amount, ₴']} />,
        render: (pharmacy) =>
          pharmacy.successfulRevenue === undefined
            ? '—'
            : (formatAmount(pharmacy.successfulRevenue) ?? '—'),
      },
      {
        key: 'rating',
        title: <TableHeaderTitle parts={['Rating /', 'reviews']} />,

        render: (pharmacy) =>
          pharmacy.reviewsCount ? (
            <RatingSummary
              rating={pharmacy.rating}
              reviewsCount={pharmacy.reviewsCount}
              size="sm"
            />
          ) : (
            'No reviews'
          ),
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Pharmacy', 'status']} />,

        render: (pharmacy) => (
          <StatusBadge {...PHARMACY_STATUS_PRESENTATION[pharmacy.status]} />
        ),
      },
    ],
    []
  );

  return (
    <main className={css.page} aria-labelledby="pharmacies-page-title">
      <section className={css.card} aria-labelledby="pharmacies-page-title">
        <PageHeader
          title={
            <span className={css.titleWithHelp}>
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
                      'Counts include only pharmacies accessible to this account. Restricted manager metrics are not disclosed.',
                    icon: <Building2 size={17} aria-hidden="true" />,
                  },
                ]}
              />
            </span>
          }
          titleId="pharmacies-page-title"
          icon={<Building2 size={23} aria-hidden="true" />}
        />

        <div className={css.statisticsBlock}>
          {statistics ? (
            <StatsGrid
              className={css.statistics}
              columns={5}
              tabletColumns={3}
              ariaLabel="Pharmacy status statistics"
            >
              {cards.map((card) => {
                const active = state.status === card.key;
                const target = active ? 'all' : card.key;

                return (
                  <StatsCard
                    key={card.key}
                    title={card.title}
                    value={card.value}
                    tone={card.tone}
                    icon={card.icon}
                    className={active ? css.activeCard : undefined}
                    href={buildOwnedPharmaciesListUrl({
                      ...state,
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
            <div className={css.statisticsError} role="alert">
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
              tabletColumns={3}
              label="Loading pharmacy status statistics"
            />
          )}
        </div>
      </section>

      <section className={css.card} aria-label="Pharmacies search and filters">
        <h2 className={css.visuallyHidden}>Pharmacies search and filters</h2>
        <div className={css.searchGrid}>
          <OwnedPharmacySearch
            value={state.pharmacyId}
            onChange={(pharmacyId) =>
              navigate({ ...state, pharmacyId, page: 1 })
            }
          />

          <div className={css.searchAction}>
            <FiltersButton
              activeCount={activeFiltersCount}
              controlsId="pharmacies-filters-panel"
              isExpanded={isFiltersOpen}
              className={css.filterButton}
              onClick={() => setIsFiltersOpen(true)}
            />
          </div>
        </div>
      </section>

      <section className={css.card} aria-label="Pharmacies list">
        <div className={css.toolbar}>
          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="pharmacies-rows-per-page"
              value={state.perPage}
              onChange={changeRowsPerPage}
            />
          </div>
          {data && !listError ? (
            <CountLabel
              className={css.countLabel}
              shown={data.items.length}
              total={data.total}
              label="pharmacies"
              fullWidthOnMobile
            />
          ) : null}
          {membershipReady &&
          canCreate &&
          (user?.status === 'new' || user?.status === 'active') ? (
            <div className={css.createArea}>
              <Button
                type="button"
                onClick={() => router.push(`${PHARMACY_ROUTES.PHARMACIES}/new`)}
                iconLeft={<Plus size={18} aria-hidden="true" />}
              >
                Create pharmacy
              </Button>
            </div>
          ) : null}
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
            {!isLoadingList && data?.total === 0 && !hasActiveFilters ? (
              <ProfileResourceState
                variant="empty"
                title="Your pharmacies will appear here"
                description="Your pharmacy drafts and verified pharmacies will appear here. Create your first pharmacy to get started."
                icon={<Building2 size={32} aria-hidden="true" />}
                action={
                  membershipReady && canCreate ? (
                    <Button
                      type="button"
                      onClick={() =>
                        router.push(`${PHARMACY_ROUTES.PHARMACIES}/new`)
                      }
                    >
                      Create your first pharmacy
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <DataTable
                columns={columns}
                items={data?.items ?? []}
                getItemKey={(pharmacy) => pharmacy.id}
                isLoading={isLoadingList}
                minWidth={1000}
                ariaLabel="Pharmacies"
                labels={{
                  loading: 'Loading pharmacies...',
                  empty: hasActiveFilters
                    ? 'No pharmacies match the selected filters.'
                    : 'You have no pharmacies yet.',
                }}
              />
            )}
            {data && data.totalPages > 1 ? (
              <PaginationView
                currentPage={data.page}
                totalPages={data.totalPages}
                disabled={isLoadingList}
                ariaLabel="Pharmacies pagination"
                onPageChange={(page) => navigate({ ...state, page })}
              />
            ) : null}
          </>
        )}
      </section>

      {isFiltersOpen ? (
        <OwnedPharmaciesFiltersDrawer
          state={state}
          locationOptions={getOwnedPharmacyLocationFilterOptions(
            data?.items ?? [],
            state.settlement,
            state.region
          )}
          hasActiveFilters={hasActiveFilters}
          minDate={
            data?.earliestCreatedAt ??
            listResult.data?.earliestCreatedAt ??
            undefined
          }
          onChange={navigate}
          onReset={resetFilters}
          onClose={() => setIsFiltersOpen(false)}
        />
      ) : null}
    </main>
  );
}

export default OwnedPharmaciesPageContent;
