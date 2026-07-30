import css from './PageLoader.module.css';

//===================================================================

type PageLoaderProps = {
  label?: string;
};

//===================================================================

function PageLoader({ label = 'Loading page' }: PageLoaderProps) {
  return (
    <div className={css.page} role="status" aria-label={label}>
      <div className={css.loader} aria-hidden="true" />
    </div>
  );
}

export default PageLoader;
export { PageLoader };
