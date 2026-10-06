'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  CirclePlus,
  Eye,
  History,
  ListFilter,
  Palette,
  PencilLine,
  RefreshCw,
  ScanSearch,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
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
  getAdminAuditChangeTone,
  getAdminAuditEntityLabel,
  getAdminAuditLocation,
  getAdminAuditStatusTransitionLabel,
} from '@/lib/audit/admin-audit-presentation';

import {
  ActivityFiltersDrawer,
  DEFAULT_ACTIVITY_HISTORY_FILTERS,
  type ActivityHistoryFilters,
} from './ActivityFiltersDrawer';

import { AuditDetailsModal } from './AuditDetailsModal';
import { ActivityActorIdentity } from './ActivityActorIdentity';

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

function getChangeToneClassName(
  tone: ReturnType<typeof getAdminAuditChangeTone>
): string {
  if (tone === 'success') return css.changeSuccess;
  if (tone === 'danger') return css.changeDanger;
  if (tone === 'pending') return css.changePending;
  if (tone === 'warning') return css.changeWarning;
  if (tone === 'neutral') return css.changeNeutral;
  return css.changeInfo;
}

//===================================================================

function createEmployeeOptions(
  actors: readonly AdminAuditActor[]
): Array<SearchableSelectOption<string>> {
  return [
    { value: '', label: 'All employees' },
    ...actors
      .filter((actor) => actor.actorType === 'employee')
      .map((actor) => ({
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
        searchText: [actor.id, actor.email, actor.phone]
          .filter(Boolean)
          .join(' '),
      })),
  ];
}

//===================================================================

function createOwnerOptions(
  actors: readonly AdminAuditActor[]
): Array<SearchableSelectOption<string>> {
  return [
    { value: '', label: 'All pharmacy owners' },
    ...actors
      .filter((actor) => actor.actorType === 'pharmacyOwner')
      .map((actor) => ({
        value: actor.id,
        label: actor.name,
        leading: (
          <TableImagePreview
            src={actor.pictureUrl}
            alt={`${actor.name} photo`}
            fallback={formatInitials(actor.name, 'O')}
            size={30}
          />
        ),
        searchText: [actor.id, actor.email, actor.phone]
          .filter(Boolean)
          .join(' '),
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
        ...(filters.actorType ? { actorType: filters.actorType } : {}),
        ...(filters.employeeUserId || filters.ownerUserId
          ? { actorUserId: filters.employeeUserId || filters.ownerUserId }
          : {}),
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

  const employeeOptions = useMemo(
    () => createEmployeeOptions(actors),
    [actors]
  );

  const ownerOptions = useMemo(() => createOwnerOptions(actors), [actors]);

  const activeFiltersCount = [
    filters.dateFrom || filters.dateTo,
    filters.action,
    filters.entityType,
    filters.section,
    filters.actorType,
    filters.employeeUserId,
    filters.ownerUserId,
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
        render: (item) => {
          const actor = actorById.get(item.actorUserId);

          return (
            <ActivityActorIdentity
              actor={actor}
              actorNameSnapshot={item.actorNameSnapshot}
            />
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
        title: (
          <span className={css.changeHeader}>
            Change
            <InfoTooltip
              label="Change color help"
              title="Change colors"
              icon={<Palette size={20} aria-hidden="true" />}
              escapeOverflow
              items={[
                {
                  title: 'Added',
                  description:
                    'Green marks newly created records and other successful additions.',
                  icon: (
                    <CirclePlus
                      className={css.legendSuccess}
                      size={17}
                      aria-hidden="true"
                    />
                  ),
                },
                {
                  title: 'Updated',
                  description:
                    'Yellow marks edits and replacements to existing records.',
                  icon: (
                    <PencilLine
                      className={css.legendPending}
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
                      className={css.legendDanger}
                      size={17}
                      aria-hidden="true"
                    />
                  ),
                },
                {
                  title: 'Status changes',
                  description:
                    'Status changes use the color of the new status, so the result is visible at a glance.',
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
            <span className={css.changeCell}>
              <strong className={`${css.changeAction} ${toneClassName}`}>
                {getAdminAuditActionLabel(item.action)}
              </strong>

              {transition ? (
                <span className={`${css.changeTransition} ${toneClassName}`}>
                  {transition}
                </span>
              ) : null}
            </span>
          );
        },
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
        render: (item) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={css.detailsButton}
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

  const updateEmployee = (employeeUserId: string) => {
    updateFilters({
      ...filters,
      employeeUserId,
      ownerUserId: '',
      actorType:
        employeeUserId && filters.actorType !== 'employee'
          ? ''
          : filters.actorType,
    });
  };

  const updateOwner = (ownerUserId: string) => {
    updateFilters({
      ...filters,
      ownerUserId,
      employeeUserId: '',
      actorType:
        ownerUserId && filters.actorType !== 'pharmacyOwner'
          ? ''
          : filters.actorType,
    });
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
                icon={<History size={20} aria-hidden="true" />}
                items={[
                  {
                    title: 'Immutable audit trail',
                    description:
                      'Critical Admin Cabinet changes are recorded as immutable history entries, so the original record remains available for review even when related data changes later.',
                    icon: <ShieldCheck size={17} aria-hidden="true" />,
                  },
                  {
                    title: 'What each record shows',
                    description:
                      'See who made the change, what was affected, where it happened, which fields changed, and the request trace. Open Details to compare the saved before and after values.',
                    icon: <ScanSearch size={17} aria-hidden="true" />,
                  },
                  {
                    title: 'Find the records you need',
                    description:
                      'Search separately by employee or pharmacy owner, then narrow the history by actor type, date, change type, entity type, or Admin Cabinet section.',
                    icon: <ListFilter size={17} aria-hidden="true" />,
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
            id="activity-employee-search"
            label="Search by employee"
            labelAccessory={
              <InfoTooltip
                label="Employee search help"
                title="Employee search"
                icon={<UsersRound size={20} aria-hidden="true" />}
                items={[
                  {
                    title: 'Search fields',
                    description:
                      'Search by employee name, ID, email, or phone number.',
                    icon: <Search size={17} aria-hidden="true" />,
                  },
                ]}
              />
            }
            value={filters.employeeUserId}
            options={employeeOptions}
            placeholder="Name, ID, email, or phone"
            emptyMessage="No employees found"
            isActive={Boolean(filters.employeeUserId)}
            isLoading={areActorsLoading}
            onChange={updateEmployee}
          />

          <SearchableSelect
            id="activity-owner-search"
            label="Search by pharmacy owner"
            labelAccessory={
              <InfoTooltip
                label="Pharmacy owner search help"
                title="Pharmacy owner search"
                icon={<UsersRound size={20} aria-hidden="true" />}
                items={[
                  {
                    title: 'Search fields',
                    description:
                      'Search by pharmacy owner name, ID, email, or phone number.',
                    icon: <Search size={17} aria-hidden="true" />,
                  },
                ]}
              />
            }
            value={filters.ownerUserId}
            options={ownerOptions}
            placeholder="Name, ID, email, or phone"
            emptyMessage="No pharmacy owners found"
            isActive={Boolean(filters.ownerUserId)}
            isLoading={areActorsLoading}
            onChange={updateOwner}
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
          minDate={data?.earliestCreatedAt ?? undefined}
          onChange={updateFilters}
          onClose={() => setIsFiltersOpen(false)}
          onReset={resetFilters}
        />
      ) : null}

      <AuditDetailsModal
        isOpen={selectedAuditId !== null}
        details={details}
        actor={details ? (actorById.get(details.actorUserId) ?? null) : null}
        isLoading={isDetailsLoading}
        error={detailsError}
        onClose={closeDetails}
        onRetry={retryDetails}
      />
    </main>
  );
}
