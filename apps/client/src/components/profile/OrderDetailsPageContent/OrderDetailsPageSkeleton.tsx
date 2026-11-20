import { Breadcrumbs } from '@e-pharmacy/ui/navigation';
import { Container } from '@e-pharmacy/ui/layout';

import { ROUTES } from '@/lib/routes';

import css from './OrderDetailsPageSkeleton.module.css';

//===================================================================

export default function OrderDetailsPageSkeleton() {
  return (
    <main
      className={css.page}
      aria-busy="true"
      aria-label="Loading order details"
    >
      <Container>
        <Breadcrumbs
          items={[
            { label: 'Home', href: ROUTES.HOME },
            { label: 'Profile', href: ROUTES.PROFILE },
            { label: 'Orders', href: `${ROUTES.PROFILE}/orders` },
            { label: 'Order details' },
          ]}
        />
        <div className={css.heading}>
          <span className={`${css.shimmer} ${css.title}`} />
          <span className={`${css.shimmer} ${css.subtitle}`} />
        </div>

        <div className={css.grid}>
          <div className={css.main}>
            <div className={css.row}>
              <span className={`${css.shimmer} ${css.avatar}`} />
              <div className={css.lines}>
                <span className={`${css.shimmer} ${css.medium}`} />
                <span className={`${css.shimmer} ${css.short}`} />
              </div>
            </div>
            {[0, 1].map((index) => (
              <div className={css.row} key={index}>
                <span className={`${css.shimmer} ${css.image}`} />
                <div className={css.lines}>
                  <span className={`${css.shimmer} ${css.medium}`} />
                  <span className={`${css.shimmer} ${css.long}`} />
                  <span className={`${css.shimmer} ${css.short}`} />
                </div>
              </div>
            ))}
          </div>

          <div className={css.summary}>
            {[0, 1, 2, 3, 4].map((index) => (
              <span key={index} className={`${css.shimmer} ${css.long}`} />
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
