import type { EntityId } from '@e-pharmacy/types';

import Container from '@/components/common/Container';

import { HOME_DESCRIPTION, HOME_TITLE } from '@/lib/constants/metadata';
import { buildProductPath } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import css from './page.module.css';

export const metadata = createPageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: '/',
});

const DEMO_PRODUCT_ID: EntityId = 'demo-product-001';

function HomePage() {
  const demoProductUrl = buildProductPath('Demo Medicine', DEMO_PRODUCT_ID);

  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="home-title">
        <Container>
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
            Product URL pattern check: <span>{demoProductUrl}</span>
          </p>
        </Container>
      </section>
    </main>
  );
}

export default HomePage;
