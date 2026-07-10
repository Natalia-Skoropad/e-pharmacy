import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';

import css from './DataTable.module.css';

//===================================================================

export type DataTableColumn<TItem> = {
  key: string;
  title: ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
  render: (item: TItem) => ReactNode;
};

export type DataTableLabels = {
  loading?: string;
  empty?: string;
};

type DataTableProps<TItem> = {
  columns: Array<DataTableColumn<TItem>>;
  items: TItem[];
  getItemKey: (item: TItem) => string;
  isLoading?: boolean;
  minWidth?: number;
  labels?: DataTableLabels;
  className?: string;
  newestFirst?: boolean;
};

//===================================================================

function getSortableTimestamp(item: unknown): number | null {
  if (!item || typeof item !== 'object') return null;

  const record = item as Record<string, unknown>;
  const value =
    record.createdAt ??
    record.addedAt ??
    record.orderDate ??
    record.firstOrderAt ??
    record.dateValue ??
    record.date ??
    record.updatedAt;

  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    !(value instanceof Date)
  ) {
    return null;
  }

  const timestamp =
    value instanceof Date ? value.getTime() : new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

//===================================================================

function getNewestFirstItems<TItem>(items: TItem[], enabled: boolean): TItem[] {
  if (!enabled || items.length < 2) return items;

  return items
    .map((item, index) => ({
      item,
      index,
      timestamp: getSortableTimestamp(item),
    }))
    .sort((first, second) => {
      if (first.timestamp === null && second.timestamp === null) {
        return first.index - second.index;
      }

      if (first.timestamp === null) return 1;
      if (second.timestamp === null) return -1;

      return second.timestamp - first.timestamp || first.index - second.index;
    })
    .map(({ item }) => item);
}

//===================================================================

function DataTable<TItem>({
  columns,
  items,
  getItemKey,
  isLoading = false,
  minWidth = 720,
  labels,
  className,
  newestFirst = true,
}: DataTableProps<TItem>) {
  const tableStyle = { minWidth } satisfies CSSProperties;
  const renderedItems = getNewestFirstItems(items, newestFirst);

  return (
    <div className={clsx(css.tableWrap, className)}>
      <table className={css.table} style={tableStyle}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={clsx(
                  column.align === 'right' && css.alignRight,
                  column.align === 'center' && css.alignCenter
                )}
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td className={css.stateCell} colSpan={columns.length}>
                {labels?.loading ?? 'Loading table data...'}
              </td>
            </tr>
          ) : renderedItems.length > 0 ? (
            renderedItems.map((item) => (
              <tr key={getItemKey(item)}>
                {columns.map((column) => (
                  <td
                    className={clsx(
                      column.align === 'right' && css.alignRight,
                      column.align === 'center' && css.alignCenter
                    )}
                    key={column.key}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className={css.stateCell} colSpan={columns.length}>
                {labels?.empty ?? 'No records yet.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
export { DataTable };
