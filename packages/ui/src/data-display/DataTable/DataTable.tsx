import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';

import css from './DataTable.module.css';

//===================================================================

export type DataTableColumn<TItem> = Readonly<{
  key: string;
  title: ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
  render: (item: TItem) => ReactNode;
}>;

//===================================================================

export type DataTableLabels = Readonly<{
  loading?: string;
  empty?: string;
}>;

export type DataTableProps<TItem> = Readonly<{
  columns: readonly DataTableColumn<TItem>[];
  items: readonly TItem[];
  getItemKey: (item: TItem) => string;
  isLoading?: boolean;
  minWidth?: number;
  labels?: DataTableLabels;
  className?: string;
  caption?: string;
  ariaLabel?: string;
}>;

//===================================================================

function DataTable<TItem>({
  columns,
  items,
  getItemKey,
  isLoading = false,
  minWidth = 720,
  labels,
  className,
  caption,
  ariaLabel,
}: DataTableProps<TItem>) {
  const tableStyle = { minWidth } satisfies CSSProperties;

  return (
    <div className={clsx(css.tableWrap, className)}>
      <table className={css.table} style={tableStyle} aria-label={ariaLabel}>
        {caption ? (
          <caption className="visually-hidden">{caption}</caption>
        ) : null}
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

        <tbody aria-busy={isLoading || undefined}>
          {isLoading ? (
            <tr>
              <td className={css.stateCell} colSpan={columns.length}>
                {labels?.loading ?? 'Loading table data...'}
              </td>
            </tr>
          ) : items.length > 0 ? (
            items.map((item) => (
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
