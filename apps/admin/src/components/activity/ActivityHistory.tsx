'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, History } from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

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
  SearchableSelect,
  type RowsPerPageValue,
  type SearchableSelectOption,
} from '@e-pharmacy/ui/forms';

import { PageHeader } from '@e-pharmacy/ui/layout';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import {
  Button,
  FiltersButton,
  TextActionButton,
} from '@e-pharmacy/ui/primitives';

import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import {
  getAdminAuditActors,
  getAdminAuditLogDetails,
  getAdminAuditLogs,
} from '@/lib/api/browser/admin-audit.api';

import {
  type AdminAuditActor,
  type AdminAuditDetails,
  type AdminAuditListResponse,
} from '@/lib/audit/admin-audit';

import {
  getAdminAuditActionLabel,
  getAdminAuditEntityLabel,
  getAdminAuditLocation,
} from '@/lib/audit/admin-audit-presentation';

import { ADMIN_ROUTES } from '@/lib/routes';

import {
  ActivityFiltersDrawer,
  DEFAULT_ACTIVITY_HISTORY_FILTERS,
  type ActivityHistoryFilters,
} from './ActivityFiltersDrawer';

import { AuditDetailsModal } from './AuditDetailsModal';
import css from './ActivityHistory.module.css';

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

  if (error.transportCode === 'INVALID_RESPONSE') {
    return 'Activity history received an unexpected server response. Please retry after refreshing the data.';
  }

  if (error.httpStatus === 403) {
    return 'You do not have permission to view Activity history.';
  }

  if (error.httpStatus && error.httpStatus >= 500) {
    return 'Activity history is temporarily unavailable. Please try again later.';
  }

  return 'Activity history could not be loaded. Please try again.';
}

//===================================================================

function createEmployeeOptions(
  actors: readonly AdminAuditActor[],
  searchBy: 'name' | 'id' | 'contact'
): Array<SearchableSelectOption<string>> {
  return [
    { value: '', label: 'All employees' },
    ...actors.map((actor) => ({
      value: actor.id,
      label: actor.name,
      leading: (
        <TableImagePreview
          src={actor.pictureUrl}
          alt={`${actor.name} photo`}
          fallback={formatInitials(actor.name, 'A')}
          size={30}
        />
      ),
      searchText:
        searchBy === 'id'
          ? actor.id
          : searchBy === 'contact'
            ? [actor.email, actor.phone, actor.address]
                .filter(Boolean)
                .join(' ')
            : actor.name,
    })),
  ];
}

//===================================================================

export function ActivityHistory() {
  const [filters, setFilters] = useState<ActivityHistoryFilters>(
    DEFAULT_ACTIVITY_HISTORY_FILTERS
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<RowsPerPageValue>(20);
  const [data, setData] = useState<AdminAuditListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [actors, setActors] = useState<readonly AdminAuditActor[]>([]);
  const [areActorsLoading, setAreActorsLoading] = useState(true);

  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [details, setDetails] = useState<AdminAuditDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsReloadVersion, setDetailsReloadVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminAuditActors({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setActors(response.items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setActors([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setAreActorsLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminAuditLogs(
      {
        page,
        perPage,
        ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
        ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.entityType ? { entityType: filters.entityType } : {}),
        ...(filters.section ? { section: filters.section } : {}),
        ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        setData(response);
        setListError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setListError(getErrorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [filters, page, perPage, reloadVersion]);

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

  const employeeNameOptions = useMemo(
    () => createEmployeeOptions(actors, 'name'),
    [actors]
  );
  const employeeIdOptions = useMemo(
    () => createEmployeeOptions(actors, 'id'),
    [actors]
  );
  const employeeContactOptions = useMemo(
    () => createEmployeeOptions(actors, 'contact'),
    [actors]
  );

  const activeFiltersCount = [
    filters.dateFrom || filters.dateTo,
    filters.action,
    filters.entityType,
    filters.section,
    filters.actorUserId,
  ].filter(Boolean).length;

  const hasFilters = activeFiltersCount > 0;

  const openDetails = useCallback((auditLogId: string) => {
    setDetails(null);
    setDetailsError(null);
    setIsDetailsLoading(true);
    setSelectedAuditId(auditLogId);
  }, []);

  const closeDetails = () => {
    setSelectedAuditId(null);
    setDetails(null);
    setDetailsError(null);
    setIsDetailsLoading(false);
  };

  const retryDetails = () => {
    if (!selectedAuditId) return;

    setDetails(null);
    setDetailsError(null);
    setIsDetailsLoading(true);
    setDetailsReloadVersion((value) => value + 1);
  };

  const columns = useMemo<
    Array<DataTableColumn<AdminAuditListResponse['items'][number]>>
  >(
    () => [
      {
        key: 'createdAt',
        title: <TableHeaderTitle parts={['Date /', 'time']} />,
        width: '150px',
        render: (item) => <TableDateTime value={item.createdAt} />,
      },
      {
        key: 'photo',
        title: <TableHeaderTitle parts={['Employee', 'photo']} />,
        width: '86px',
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
        title: 'Employee',
        render: (item) => {
          const actor = actorById.get(item.actorUserId);

          return (
            <span className={css.employeeCell}>
              <TextActionButton
                href={`${ADMIN_ROUTES.SETTINGS_EMPLOYEES}/${encodeURIComponent(
                  item.actorUserId
                )}`}
              >
                {item.actorNameSnapshot}
              </TextActionButton>

              {actor ? (
                <StatusBadge {...USER_STATUS_PRESENTATION[actor.status]} />
              ) : (
                <span className={css.employeeStatusFallback}>Unavailable</span>
              )}
            </span>
          );
        },
      },
      {
        key: 'entity',
        title: 'Entity',
        render: (item) => (
          <span>
            <strong>{item.entityLabelSnapshot}</strong>
            <span className={css.entityType}>
              {getAdminAuditEntityLabel(item.entityType)}
            </span>
          </span>
        ),
      },
      {
        key: 'action',
        title: 'Change',
        render: (item) => getAdminAuditActionLabel(item.action),
      },
      {
        key: 'location',
        title: <TableHeaderTitle parts={['Section /', 'page']} />,
        render: (item) => {
          const location = getAdminAuditLocation(item);

          return (
            <TextActionButton
              className={css.breakableLink}
              href={location.href}
            >
              {location.label}
            </TextActionButton>
          );
        },
      },
      {
        key: 'fields',
        title: <TableHeaderTitle parts={['Changed', 'fields']} />,
        render: (item) => (
          <span className={css.changedFields}>
            {item.changedFields.join(', ')}
          </span>
        ),
      },
      {
        key: 'details',
        title: 'Actions',
        align: 'right',
        width: '120px',
        render: (item) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
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

  const beginListRefresh = () => {
    setIsLoading(true);
    setListError(null);
  };

  const updateFilters = (nextFilters: ActivityHistoryFilters) => {
    beginListRefresh();
    setFilters(nextFilters);
    setPage(1);
  };

  const updateEmployee = (actorUserId: string) => {
    updateFilters({ ...filters, actorUserId });
  };

  const updatePerPage = (value: RowsPerPageValue) => {
    beginListRefresh();
    setPerPage(value);
    setPage(1);
  };

  const updatePage = (nextPage: number) => {
    beginListRefresh();
    setPage(nextPage);
  };

  const retryList = () => {
    beginListRefresh();
    setReloadVersion((value) => value + 1);
  };

  const resetFilters = () => updateFilters(DEFAULT_ACTIVITY_HISTORY_FILTERS);

  return (
    <main className={css.page} aria-labelledby="activity-history-page-title">
      <section
        className={css.card}
        aria-labelledby="activity-history-page-title"
      >
        <PageHeader
          title={
            <span className={css.titleWithHelp}>
              Activity history
              <InfoTooltip
                label="About Activity history"
                title="Activity history"
                items={[
                  {
                    title: 'Immutable audit trail',
                    description:
                      'Critical Admin Cabinet changes are recorded as immutable history entries, so the original record remains available for review even when related data changes later.',
                  },
                  {
                    title: 'What each record shows',
                    description:
                      'See who made the change, what was affected, where it happened, which fields changed, and the request trace. Open Details to compare the saved before and after values.',
                  },
                  {
                    title: 'Find the records you need',
                    description:
                      'Search by employee name, ID, or contacts, then narrow the history by date, change type, entity type, or Admin Cabinet section.',
                  },
                ]}
              />
            </span>
          }
          titleId="activity-history-page-title"
          icon={<History size={23} aria-hidden="true" />}
        />
      </section>

      <section className={css.card} aria-labelledby="activity-search-title">
        <h2 className={css.visuallyHidden} id="activity-search-title">
          Activity history search
        </h2>

        <div className={css.searchGrid}>
          <SearchableSelect
            id="activity-employee-name-search"
            label="Employee name search"
            value={filters.actorUserId}
            options={employeeNameOptions}
            placeholder="Employee name"
            emptyMessage="No employees found"
            isActive={Boolean(filters.actorUserId)}
            isLoading={areActorsLoading}
            onChange={updateEmployee}
          />

          <SearchableSelect
            id="activity-employee-id-search"
            label="Employee ID search"
            value={filters.actorUserId}
            options={employeeIdOptions}
            placeholder="Employee ID"
            emptyMessage="No employees found"
            isActive={Boolean(filters.actorUserId)}
            isLoading={areActorsLoading}
            onChange={updateEmployee}
          />

          <SearchableSelect
            id="activity-employee-contact-search"
            label="Employee contact search"
            value={filters.actorUserId}
            options={employeeContactOptions}
            placeholder="Email, phone, or address"
            emptyMessage="No employees found"
            isActive={Boolean(filters.actorUserId)}
            isLoading={areActorsLoading}
            onChange={updateEmployee}
          />

          <div className={css.searchAction}>
            <FiltersButton
              activeCount={activeFiltersCount}
              controlsId="activity-history-filters-panel"
              isExpanded={isFiltersOpen}
              onClick={() => setIsFiltersOpen(true)}
              className={css.filterButton}
            />
          </div>
        </div>
      </section>

      <section className={css.card} aria-label="Activity history table">
        <div className={css.toolbar}>
          <div className={css.rowsControl}>
            <RowsPerPageSelect
              id="activity-rows-per-page"
              value={perPage}
              disabled={isLoading}
              onChange={updatePerPage}
            />
          </div>

          {data ? (
            <CountLabel
              className={css.countLabel}
              shown={data.items.length}
              total={data.total}
              label="records"
            />
          ) : null}
        </div>

        {!data && listError ? (
          <ProfileResourceState
            variant="error"
            title="Activity history is unavailable"
            description={listError}
            retryLabel="Try again"
            onRetry={retryList}
          />
        ) : (
          <>
            {listError && data ? (
              <div className={css.inlineError} role="alert">
                <span>{listError}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={retryList}
                >
                  Retry
                </Button>
              </div>
            ) : null}

            <DataTable
              columns={columns}
              items={data?.items ?? []}
              getItemKey={(item) => item.id}
              isLoading={isLoading}
              minWidth={0}
              ariaLabel="Admin activity history"
              labels={{
                loading: data
                  ? 'Refreshing activity history...'
                  : 'Loading activity history...',
                empty: hasFilters
                  ? 'No activity matches the selected filters.'
                  : 'Activity history is empty.',
              }}
            />

            {data ? (
              <PaginationView
                currentPage={data.page}
                totalPages={data.totalPages}
                disabled={isLoading}
                ariaLabel="Activity history pagination"
                onPageChange={updatePage}
              />
            ) : null}
          </>
        )}
      </section>

      {isFiltersOpen ? (
        <ActivityFiltersDrawer
          filters={filters}
          hasActiveFilters={hasFilters}
          onChange={updateFilters}
          onClose={() => setIsFiltersOpen(false)}
          onReset={resetFilters}
        />
      ) : null}

      <AuditDetailsModal
        isOpen={selectedAuditId !== null}
        details={details}
        isLoading={isDetailsLoading}
        error={detailsError}
        onClose={closeDetails}
        onRetry={retryDetails}
      />
    </main>
  );
}
