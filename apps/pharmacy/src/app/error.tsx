'use client';

import Link from 'next/link';

import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';

import css from '@/components/pharmacy/ServicePage.module.css';

//===================================================================

type ErrorPageProps = Readonly<{
  reset: () => void;
}>;

//===================================================================

function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className={css.page}>
      <section className={css.card} aria-labelledby="error-title">
        <p className={css.kicker}>Route guard</p>
        <h1 id="error-title">Something went wrong, but your route is still safe</h1>
        <p>
          The pharmacy cabinet could not render this page. Please try again or
          return to the dashboard.
        </p>
        <div className={css.actions}>
          <button type="button" onClick={reset}>
            Try again
          </button>
          <Link href={getPharmacyDashboardPath()}>Back to dashboard</Link>
        </div>
      </section>
    </main>
  );
}

export default ErrorPage;
