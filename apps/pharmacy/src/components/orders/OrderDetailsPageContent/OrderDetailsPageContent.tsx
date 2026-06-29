import Link from 'next/link';

import { ButtonLink, StatusBanner } from '@e-pharmacy/ui/common';

import { getPharmacyProfilePath } from '@/lib/pharmacy/routes';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

type OrderDetailsPageContentProps = Readonly<{
  orderId: string;
}>;

//===================================================================

function OrderDetailsPageContent({ orderId }: OrderDetailsPageContentProps) {
  const title = `Order #${orderId}`;

  return (
    <main className={css.page} aria-labelledby="order-details-page-title">
      <div className={css.contentCard}>
        <div className={css.stack}>
          <h1 className={css.title} id="order-details-page-title">
            {title}
          </h1>

          <StatusBanner
            status="new"
            label="New"
            title="Order details is locked for now"
            message="This page belongs to business functionality that opens after Admin verifies your pharmacy profile."
          />

          <section className={css.card} aria-labelledby="order-actions-title">
            <h2 id="order-actions-title">What can you do now?</h2>
            <p>
              Complete the pharmacy profile, check that registration documents are
              attached, and send the profile for verification.
            </p>
            <div className={css.actions}>
              <ButtonLink
                href={getPharmacyProfilePath()}
                renderLink={({ href, className, children, ...props }) => (
                  <Link href={href} className={className} {...props}>
                    {children}
                  </Link>
                )}
              >
                Go to profile
              </ButtonLink>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default OrderDetailsPageContent;
export { OrderDetailsPageContent };
