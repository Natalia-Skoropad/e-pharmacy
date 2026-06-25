import css from './TableStates.module.css';

//===================================================================

type TableEmptyStateProps = Readonly<{
  title?: string;
  message?: string;
}>;

//===================================================================

export function TableEmptyState({
  title = 'No data yet',
  message = 'New records will appear here when they become available.',
}: TableEmptyStateProps) {
  return (
    <div className={css.state}>
      <p className={css.title}>{title}</p>
      <p className={css.message}>{message}</p>
    </div>
  );
}
