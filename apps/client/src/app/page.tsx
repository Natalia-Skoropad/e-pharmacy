import type { Metadata } from 'next';

import type { EntityId } from '@e-pharmacy/types';
import { buildSlugId } from '@e-pharmacy/utils';

import { HOME_DESCRIPTION, HOME_TITLE } from '@/lib/constants/metadata';

import css from './page.module.css';

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
};

const DEMO_PRODUCT_ID: EntityId = 'demo-product-001';

function HomePage() {
  const demoProductUrl = `/${buildSlugId('Demo Medicine', DEMO_PRODUCT_ID)}`;

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

          <p className={css.note}>
            Shared URL helper check: <span>{demoProductUrl}</span>
          </p>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
