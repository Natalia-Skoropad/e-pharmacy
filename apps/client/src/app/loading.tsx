import css from './loading.module.css';

//===================================================================

function LoadingPage() {
  return (
    <div className={css.page} role="status" aria-label="Loading page">
      <div className={css.loader} aria-hidden="true" />
    </div>
  );
}

export default LoadingPage;
