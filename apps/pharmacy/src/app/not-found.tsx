import Link from 'next/link';

import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';

import css from '@/components/pharmacy/ServicePage.module.css';

//===================================================================

function NotFoundPage() {
  return (
    <main className={css.page}>
      <section className={css.card} aria-labelledby="not-found-title">
        <p className={css.kicker}>404</p>
        <h1 id="not-found-title">Page not found</h1>
        <p>The page you are looking for does not exist in Pharmacy Cabinet.</p>
        <div className={css.actions}>
          <Link href={getPharmacyDashboardPath()}>Back to dashboard</Link>
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;
