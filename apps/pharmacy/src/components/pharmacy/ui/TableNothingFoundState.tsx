import css from './TableStates.module.css';

//===================================================================

type TableNothingFoundStateProps = Readonly<{
  title?: string;
  message?: string;
}>;

//===================================================================

export function TableNothingFoundState({
  title = 'Nothing found',
  message = 'Try changing or resetting the selected filters.',
}: TableNothingFoundStateProps) {
  return (
    <div className={css.state}>
      <p className={css.title}>{title}</p>
      <p className={css.message}>{message}</p>
    </div>
  );
}
