'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  DataTable,
  TableDateTime,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import {
  DateFilter,
  RowsPerPageSelect,
  SelectField,
} from '@e-pharmacy/ui/forms';

import { PaginationView } from '@e-pharmacy/ui/navigation';
import { Button } from '@e-pharmacy/ui/primitives';
import { PageLoader } from '@e-pharmacy/ui/status-pages';

import {
  getAdminAuditLogDetails,
  getAdminAuditLogs,
} from '@/lib/api/browser/admin-audit.api';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  type AdminAuditAction,
  type AdminAuditDetails,
  type AdminAuditEntityType,
  type AdminAuditListResponse,
} from '@/lib/audit/admin-audit';

import {
  getAdminAuditActionLabel,
  getAdminAuditEntityLabel,
} from '@/lib/audit/admin-audit-presentation';

import { AuditDetailsModal } from './AuditDetailsModal';
import css from './ActivityHistory.module.css';

//===================================================================

type AuditFilters = Readonly<{
  dateFrom: string;
  dateTo: string;
  action: '' | AdminAuditAction;
  entityType: '' | AdminAuditEntityType;
}>;

const DEFAULT_FILTERS: AuditFilters = {
  dateFrom: '',
  dateTo: '',
  action: '',
  entityType: '',
};

//===================================================================

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  ...ADMIN_AUDIT_ACTIONS.map((action) => ({
    value: action,
    label: getAdminAuditActionLabel(action),
  })),
] as const;

const ENTITY_OPTIONS = [
  { value: '', label: 'All entity types' },
  ...ADMIN_AUDIT_ENTITY_TYPES.map((entityType) => ({
    value: entityType,
    label: getAdminAuditEntityLabel(entityType),
  })),
] as const;

//===================================================================

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

//===================================================================

export function ActivityHistory() {
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<20 | 50 | 100>(20);
  const [data, setData] = useState<AdminAuditListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [details, setDetails] = useState<AdminAuditDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsReloadVersion, setDetailsReloadVersion] = useState(0);

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
      },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        setData(response);
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

  const hasFilters = Boolean(
    filters.dateFrom || filters.dateTo || filters.action || filters.entityType
  );

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
        title: 'Date / time',
        width: '150px',
        render: (item) => <TableDateTime value={item.createdAt} />,
      },
      {
        key: 'actor',
        title: 'Employee',
        render: (item) => item.actorNameSnapshot,
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
        title: 'Action',
        render: (item) => getAdminAuditActionLabel(item.action),
      },
      {
        key: 'fields',
        title: 'Changed fields',
        render: (item) => item.changedFields.join(', '),
      },
      {
        key: 'details',
        title: '',
        align: 'right',
        width: '100px',
        render: (item) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => openDetails(item.id)}
          >
            Details
          </Button>
        ),
      },
    ],
    [openDetails]
  );

  const beginListRefresh = () => {
    setIsLoading(true);
    setListError(null);
  };

  const updateFilters = (nextFilters: AuditFilters) => {
    beginListRefresh();
    setFilters(nextFilters);
    setPage(1);
  };

  const updatePerPage = (value: 20 | 50 | 100) => {
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

  if (!data && isLoading) {
    return <PageLoader label="Loading activity history..." />;
  }

  if (!data && listError) {
    return (
      <section className={css.state} role="alert">
        <h1>Activity history</h1>
        <p>{listError}</p>
        <Button type="button" onClick={retryList}>
          Retry
        </Button>
      </section>
    );
  }

  return (
    <section className={css.page}>
      <div className={css.heading}>
        <div>
          <p className={css.eyebrow}>Settings</p>
          <h1>Activity history</h1>
          <p>Review immutable records of critical Admin Cabinet changes.</p>
        </div>
      </div>

      <div className={css.filters} aria-label="Activity filters">
        <DateFilter
          id="admin-audit-date"
          label="Date"
          value={{ from: filters.dateFrom, to: filters.dateTo }}
          onChange={(value) =>
            updateFilters({
              ...filters,
              dateFrom: value.from,
              dateTo: value.to,
            })
          }
        />

        <SelectField
          label="Action"
          value={filters.action}
          options={ACTION_OPTIONS}
          onChange={(action) => updateFilters({ ...filters, action })}
        />

        <SelectField
          label="Entity type"
          value={filters.entityType}
          options={ENTITY_OPTIONS}
          onChange={(entityType) => updateFilters({ ...filters, entityType })}
        />

        <Button
          type="button"
          variant="secondary"
          disabled={!hasFilters || isLoading}
          onClick={() => updateFilters(DEFAULT_FILTERS)}
        >
          Reset filters
        </Button>
      </div>

      {listError && data ? (
        <div className={css.inlineError} role="alert">
          <span>{listError}</span>
          <Button type="button" variant="ghost" size="sm" onClick={retryList}>
            Retry
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        items={data?.items ?? []}
        getItemKey={(item) => item.id}
        isLoading={isLoading && Boolean(data)}
        minWidth={900}
        ariaLabel="Admin activity history"
        labels={{
          loading: 'Refreshing activity history...',
          empty: hasFilters
            ? 'No activity matches the selected filters.'
            : 'Activity history is empty.',
        }}
      />

      <div className={css.paginationRow}>
        <RowsPerPageSelect
          value={perPage}
          disabled={isLoading}
          onChange={updatePerPage}
        />

        <PaginationView
          currentPage={data?.page ?? page}
          totalPages={data?.totalPages ?? 0}
          disabled={isLoading}
          ariaLabel="Activity history pagination"
          onPageChange={updatePage}
        />
      </div>

      <AuditDetailsModal
        isOpen={selectedAuditId !== null}
        details={details}
        isLoading={isDetailsLoading}
        error={detailsError}
        onClose={closeDetails}
        onRetry={retryDetails}
      />
    </section>
  );
}
