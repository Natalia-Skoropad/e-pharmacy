import { DataTable, type DataTableColumn } from '@e-pharmacy/ui/data-display';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import type {
  AdminAuditDetails,
  AdminAuditValue,
} from '@/lib/audit/admin-audit';

import {
  getAdminAuditStatusPresentation,
  formatAdminAuditValue,
} from '@/lib/audit/admin-audit-presentation';

import {
  getProductRequestAuditRows,
  type ProductRequestAuditRow,
  type ProductRequestAuditStatus,
} from '@/lib/audit/product-request-audit-presentation';

import { RenderAuditValue } from './AuditChangeValue';

import css from './ActivityHistory.module.css';

//===================================================================

function Value({
  value,
  field,
  status,
}: Readonly<{
  value: AdminAuditValue;
  field: string;
  status?: ProductRequestAuditStatus;
}>) {
  if (status) {
    const presentation = getAdminAuditStatusPresentation(status.value);

    return (
      <div className={css.changeValue}>
        {presentation ? <StatusBadge {...presentation} /> : status.value}
        {status.needsChanges ? (
          <StatusBadge label="Needs changes" tone="neutral" />
        ) : null}
        {status.cancellation ? (
          <StatusBadge
            label={
              status.cancellation === 'admin'
                ? 'Cancelled by Admin'
                : 'Cancelled by owner'
            }
            tone="neutral"
          />
        ) : null}
      </div>
    );
  }

  if (
    (field === 'fullDescription' || field === 'pharmacyComment') &&
    typeof value === 'string' &&
    value.trim()
  ) {
    return <RenderAuditValue field={field} value={value} />;
  }

  return (
    <div className={css.productRequestAuditValue}>
      {Array.isArray(value)
        ? value.join('\n')
        : value === null
          ? '—'
          : formatAdminAuditValue(value)}
    </div>
  );
}

//===================================================================

const COLUMNS: readonly DataTableColumn<ProductRequestAuditRow>[] = [
  {
    key: 'label',
    title: 'Changed field',
    width: '27%',
    render: (row) => <span className={css.changeFieldName}>{row.label}</span>,
  },
  {
    key: 'field',
    title: 'Field',
    width: '23%',
    render: (row) => (
      <code className={css.changeDeveloperField}>{row.developerField}</code>
    ),
  },
  {
    key: 'before',
    title: 'Before',
    width: '25%',
    render: (row) => (
      <Value field={row.field} value={row.before} status={row.beforeStatus} />
    ),
  },
  {
    key: 'after',
    title: 'After',
    width: '25%',
    render: (row) => (
      <Value field={row.field} value={row.after} status={row.afterStatus} />
    ),
  },
];

//===================================================================

export function ProductRequestAuditChanges({
  details,
}: Readonly<{ details: AdminAuditDetails }>) {
  const rows = getProductRequestAuditRows(details);

  return (
    <DataTable
      columns={COLUMNS}
      items={rows}
      getItemKey={(row) => row.field}
      minWidth={650}
      ariaLabel="Audit changes"
      labels={{ empty: 'No field-level changes were recorded.' }}
    />
  );
}
