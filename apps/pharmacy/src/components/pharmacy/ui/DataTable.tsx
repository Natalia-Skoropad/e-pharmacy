import type { ReactNode } from 'react';

import css from './DataTable.module.css';

//===================================================================

export type DataTableColumn<TRow> = Readonly<{
  key: string;
  header: ReactNode;
  render: (row: TRow) => ReactNode;
}>;

type DataTableProps<TRow> = Readonly<{
  columns: readonly DataTableColumn<TRow>[];
  rows: readonly TRow[];
  getRowKey: (row: TRow) => string;
  caption?: string;
}>;

//===================================================================

export function DataTable<TRow>({
  columns,
  rows,
  getRowKey,
  caption,
}: DataTableProps<TRow>) {
  return (
    <div className={css.wrapper}>
      <table className={css.table}>
        {caption ? <caption className="visually-hidden">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
