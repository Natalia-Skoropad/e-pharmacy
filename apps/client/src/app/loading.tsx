import css from './loading.module.css';

//===================================================================

function LoadingPage() {
  return (
    <main className={css.page} aria-label="Loading page">
      <div className={css.loader} aria-hidden="true" />
    </main>
  );
}

export default LoadingPage;
