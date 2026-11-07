'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, ListOrdered, ShoppingBag, Wallet } from 'lucide-react';

import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { OwnedPharmacyOption } from '@e-pharmacy/types/pharmacies';

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
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { FiltersButton, TextActionButton } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { formatAmount } from '@e-pharmacy/utils/money';

import {
  getClientPharmacies,
  type ClientPharmaciesResponse,
  type ClientPharmacyOrderSummary,
} from '@/lib/api/browser/clients.api';

import {
  OWNED_PHARMACIES_LIST_URL_DEFAULTS,
  buildOwnedPharmaciesListApiParams,
  type OwnedPharmacyListUrlState,
} from '@/lib/pharmacies/owned-pharmacy-url';

import { getOwnedPharmacyLocationFilterOptions } from '@/lib/pharmacies/owned-pharmacy-location-options';

import {
  loadCompletePharmacyLocations,
  type PharmacyLocationRow,
} from '@/lib/pharmacies/load-complete-pharmacy-locations';

import { getOwnedPharmacyPath } from '@/lib/routes';

import {
  buildClientPharmaciesPath,
  parseClientPharmaciesSegments,
} from '@/lib/clients/client-pharmacies-path';

import { OwnedPharmacySearch } from '@/components/pharmacies/OwnedPharmacySearch/OwnedPharmacySearch';
import { OwnedPharmaciesFiltersDrawer } from '@/components/pharmacies/OwnedPharmaciesFiltersDrawer/OwnedPharmaciesFiltersDrawer';

import css from './ClientPharmaciesTab.module.css';

//===================================================================

const ZERO_DATA_TEXT = 'No pharmacies match the selected filters.';

//===============================================================

export function ClientPharmaciesTab({
  clientId,
  initialState = OWNED_PHARMACIES_LIST_URL_DEFAULTS,
}: Readonly<{ clientId: string; initialState?: OwnedPharmacyListUrlState }>) {
  const router = useRouter();
  const pathname = usePathname();

  // Next App Router can preserve the client tab across sibling filter routes.
  // Resolve the state from the *current URL*, not the first mounted props.
  // useMemo also keeps API request dependencies stable while client details load.
  const state = useMemo(() => {
    const base = `/pharmacy/clients/${clientId}/pharmacies`;

    if (pathname === base) {
      return parseClientPharmaciesSegments();
    }

    if (pathname.startsWith(`${base}/`)) {
      return parseClientPharmaciesSegments(
        pathname.slice(base.length + 1).split('/')
      );
    }

    return initialState;
  }, [clientId, initialState, pathname]);

  const navigate = useCallback(
    (value: OwnedPharmacyListUrlState) => {
      router.push(buildClientPharmaciesPath(clientId, value), {
        scroll: false,
      });
    },
    [router, clientId]
  );

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [locations, setLocations] = useState<
    readonly PharmacyLocationRow[] | null
  >(null);

  const [retry, setRetry] = useState(0);

  const query = useMemo(
    () => buildOwnedPharmaciesListApiParams(state),
    [state]
  );

  const key = `${clientId}:${JSON.stringify(query)}:${retry}`;

  const [snapshot, setSnapshot] = useState<Readonly<{
    key: string;
    data: ClientPharmaciesResponse | null;
    error: boolean;
  }> | null>(null);

  const current = snapshot?.key === key ? snapshot : null;
  const data = current?.data ?? null;
  const isLoading = !current;

  useEffect(() => {
    const controller = new AbortController();

    void getClientPharmacies(clientId, query, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        setSnapshot({ key, data: response, error: false });

        if (response.page !== state.page) {
          router.replace(
            buildClientPharmaciesPath(clientId, {
              ...state,
              page: response.page,
            }),

            { scroll: false }
          );
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSnapshot({ key, data: null, error: true });
        }
      });

    return () => controller.abort();
  }, [clientId, key, query, router, state]);

  useEffect(() => {
    if (!isFiltersOpen || locations !== null) return;

    const controller = new AbortController();

    void loadCompletePharmacyLocations(
      (page) =>
        getClientPharmacies(
          clientId,
          { page, perPage: 100 },
          {
            signal: controller.signal,
          }
        ),

      controller.signal
    )
      .then((rows) => {
        if (!controller.signal.aborted) setLocations(rows);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLocations([]);
      });

    return () => controller.abort();
  }, [clientId, isFiltersOpen, locations]);

  const loadSearchOptions = useCallback(
    async (
      search: string,
      signal: AbortSignal
    ): Promise<readonly OwnedPharmacyOption[]> => {
      const response = await getClientPharmacies(
        clientId,
        { pharmacySearch: search || undefined, perPage: 20 },
        { signal }
      );

      return response.items.map((item) => ({
        id: item.pharmacyId,
        name: item.pharmacyName,

        ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
        ...(item.email ? { email: item.email } : {}),
        ...(item.phone ? { phone: item.phone } : {}),
        ...(item.location ? { location: item.location } : {}),

        status: item.status,

        ...(item.reviewState ? { reviewState: item.reviewState } : {}),

        membershipRole: 'owner' as const,
      }));
    },
    [clientId]
  );

  const columns = useMemo<Array<DataTableColumn<ClientPharmacyOrderSummary>>>(
    () => [
      {
        key: 'createdAt',
        title: <TableHeaderTitle parts={['Created', 'date']} />,
        render: (item) => <TableDateTime value={item.createdAt} />,
      },
      {
        key: 'photo',
        title: <TableHeaderTitle parts={['Pharmacy', 'photo']} />,

        render: (item) => (
          <TableImagePreview
            src={item.imageUrl}
            alt={`${item.pharmacyName} photo`}
            fallback={formatInitials(item.pharmacyName, 'P')}
          />
        ),
      },
      {
        key: 'pharmacyId',
        title: <TableHeaderTitle parts={['Pharmacy', 'ID']} />,

        render: (item) => (
          <TextActionButton
            className={css.breakableLink}
            href={getOwnedPharmacyPath(item.pharmacyId)}
          >
            {item.pharmacyId}
          </TextActionButton>
        ),
      },
      {
        key: 'name',
        title: <TableHeaderTitle parts={['Pharmacy', 'name']} />,

        render: (item) => (
          <TextActionButton href={getOwnedPharmacyPath(item.pharmacyId)}>
            {item.pharmacyName}
          </TextActionButton>
        ),
      },
      {
        key: 'successfulOrdersCount',

        title: (
          <span className={css.headerWithHelp}>
            <TableHeaderTitle parts={['Orders', 'count']} />
            <InfoTooltip
              label="About this client's successful orders"
              title="Successful orders – this client"
              icon={<ShoppingBag size={18} aria-hidden="true" />}
              escapeOverflow
              preferTopLayer
              items={[
                {
                  title: 'Orders count',
                  description:
                    'Number of Successful orders this specific client placed at this pharmacy. Orders from other clients and other statuses are excluded.',
                  icon: <ListOrdered size={17} />,
                },
                {
                  title: 'Orders amount',
                  description:
                    'Total value (₴) of this specific client’s Successful orders at this pharmacy. Orders from other clients, pending and rejected orders are excluded.',
                  icon: <Wallet size={17} />,
                },
              ]}
            />
          </span>
        ),

        render: (item) => item.successfulOrdersCount,
      },
      {
        key: 'successfulOrdersAmount',
        title: <TableHeaderTitle parts={['Orders', 'amount, ₴']} />,
        render: (item) => formatAmount(item.successfulOrdersAmount) ?? '0.00',
      },
      {
        key: 'rating',
        title: <TableHeaderTitle parts={['Rating /', 'reviews']} />,

        render: (item) =>
          item.reviewsCount ? (
            <RatingSummary
              rating={item.rating}
              reviewsCount={item.reviewsCount}
              size="sm"
            />
          ) : (
            'No reviews'
          ),
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Pharmacy', 'status']} />,

        render: (item) => (
          <div className={css.statusCell}>
            <StatusBadge {...PHARMACY_STATUS_PRESENTATION[item.status]} />
            {item.reviewState === 'changes_requested' &&
            ['on_verification', 'on_moderation', 'on_reactivation'].includes(
              item.status
            ) ? (
              <StatusBadge label="Needs changes" tone="neutral" />
            ) : null}
          </div>
        ),
      },
    ],
    []
  );

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
      ...OWNED_PHARMACIES_LIST_URL_DEFAULTS,
      perPage: state.perPage,
    });

  return (
    <div className={css.page}>
      <ProfileSectionHeader
        title="Pharmacies"
        description="View this client's pharmacies and successful orders at each location."
        icon={<Building2 size={21} aria-hidden="true" />}
      />

      <section
        className={css.card}
        aria-label="Client pharmacy search and filters"
      >
        <div className={css.searchGrid}>
          <OwnedPharmacySearch
            id={`client-${clientId}-pharmacy-search`}
            value={state.pharmacyId}
            loadOptions={loadSearchOptions}
            onChange={(pharmacyId) =>
              navigate({ ...state, pharmacyId, page: 1 })
            }
          />

          <div className={css.searchAction}>
            <FiltersButton
              className={css.filterButton}
              activeCount={activeFiltersCount}
              controlsId="pharmacies-filters-panel"
              isExpanded={isFiltersOpen}
              onClick={() => setIsFiltersOpen(true)}
            />
          </div>
        </div>
      </section>

      <section className={css.card} aria-label="Client pharmacies list">
        <div className={css.toolbar}>
          <RowsPerPageSelect
            id={`client-${clientId}-pharmacies-rows-per-page`}
            value={state.perPage}
            onChange={(perPage: RowsPerPageValue) =>
              navigate({ ...state, perPage, page: 1 })
            }
          />

          <CountLabel
            className={css.countLabel}
            shown={data?.items.length ?? 0}
            total={data?.total ?? 0}
            label="pharmacies"
            fullWidthOnMobile
          />
        </div>

        {current?.error ? (
          <ProfileResourceState
            variant="error"
            title="Client pharmacies could not be loaded"
            description="Please try again to view this client's pharmacies."
            retryLabel="Try again"
            sideActionOnDesktop
            onRetry={() => setRetry((value) => value + 1)}
          />
        ) : (
          <>
            <DataTable
              ariaLabel="Pharmacies related to this client"
              columns={columns}
              items={data?.items ?? []}
              getItemKey={(item) => item.pharmacyId}
              isLoading={isLoading}
              minWidth={950}
              labels={{
                loading: 'Loading client pharmacies...',

                empty: hasActiveFilters
                  ? ZERO_DATA_TEXT
                  : 'This client is not associated with any accessible pharmacies.',
              }}
            />
            {data && data.totalPages > 1 ? (
              <PaginationView
                currentPage={data.page}
                totalPages={data.totalPages}
                disabled={isLoading}
                ariaLabel="Client pharmacies pagination"
                onPageChange={(page) => navigate({ ...state, page })}
              />
            ) : null}
          </>
        )}
      </section>

      {isFiltersOpen ? (
        <OwnedPharmaciesFiltersDrawer
          state={state}
          hasActiveFilters={hasActiveFilters}
          minDate={data?.earliestCreatedAt ?? undefined}
          locationsLoading={locations === null}
          locationOptions={getOwnedPharmacyLocationFilterOptions(
            locations?.length ? locations : (data?.items ?? []),
            state.settlement,
            state.region
          )}
          onChange={navigate}
          onReset={resetFilters}
          onClose={() => setIsFiltersOpen(false)}
        />
      ) : null}
    </div>
  );
}
