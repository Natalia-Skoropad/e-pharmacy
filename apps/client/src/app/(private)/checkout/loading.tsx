import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/seo/metadata-copy';
import { ROUTES } from '@/lib/routes';

import { OrderPageSkeleton } from '@/components/common/OrderPageSkeleton/OrderPageSkeleton';

import css from '@/components/checkout/CheckoutPageContent/CheckoutPageContent.module.css';

//===================================================================

/** App Router fallback for both /checkout and /checkout/[slugId]. */
export default function CheckoutLoading() {
  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="checkout-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Cart', href: ROUTES.CART },
              { label: CHECKOUT_TITLE },
            ]}
          />
          <div className={css.hero}>
            <h1 className={css.title} id="checkout-title">
              {CHECKOUT_TITLE}
            </h1>
            <p className={css.text}>{CHECKOUT_DESCRIPTION}</p>
          </div>
          <OrderPageSkeleton variant="checkout" />
        </Container>
      </section>
    </main>
  );
}
