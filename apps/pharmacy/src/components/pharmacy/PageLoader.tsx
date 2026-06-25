import css from './PageLoader.module.css';

//===================================================================

type PageLoaderProps = Readonly<{
  label?: string;
}>;

//===================================================================

export function PageLoader({ label = 'Loading...' }: PageLoaderProps) {
  return (
    <div className={css.loader} role="status" aria-live="polite">
      <span className={css.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
