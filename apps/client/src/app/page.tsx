import type { Metadata } from 'next';

import { HOME_DESCRIPTION, HOME_TITLE } from '@/lib/constants/metadata';

import css from './page.module.css';

//===================================================================

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
};

//===================================================================

function HomePage() {
  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="home-title">
        <div className={css.container}>
          <p className={css.kicker}>Customer storefront</p>

          <h1 className={css.title} id="home-title">
            E-PHARMACY client foundation
          </h1>

          <p className={css.text}>
            The public customer storefront is ready for the next development
            stages: layout, navigation, catalog, product pages, cart and
            checkout.
          </p>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
