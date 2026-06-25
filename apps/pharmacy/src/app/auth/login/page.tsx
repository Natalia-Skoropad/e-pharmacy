import { Suspense } from 'react';
import type { Metadata } from 'next';

import { PharmacyLoginForm } from '@/components/auth/PharmacyLoginForm';

import css from './page.module.css';

//===================================================================

export const metadata: Metadata = {
  title: 'Pharmacy login',
  description: 'Sign in to the E-PHARMACY pharmacy cabinet.',
  robots: {
    index: false,
    follow: false,
  },
};

//===================================================================

function PharmacyLoginPage() {
  return (
    <main className={css.page}>
      <section className={css.card} aria-labelledby="pharmacy-login-title">
        <p className={css.kicker}>Pharmacy cabinet</p>
        <h1 id="pharmacy-login-title">Sign in to E-PHARMACY</h1>
        <p className={css.description}>
          Use a pharmacy account to continue to the private cabinet.
        </p>
        <Suspense fallback={null}>
          <PharmacyLoginForm />
        </Suspense>
      </section>
    </main>
  );
}

export default PharmacyLoginPage;
