import { Container } from '@e-pharmacy/ui/layout';

import type { ProductTab } from '@/lib/routes/product-detail-tabs';

import css from './ProductDetailsLoading.module.css';

//===================================================================

function Block({ className = '' }: Readonly<{ className?: string }>) {
  return <span className={`${css.shimmer} ${className}`} />;
}

//===================================================================

/** Route fallback for product Details / Pharmacies / Characteristics / Reviews. */
export function ProductDetailsLoading({
  tab = 'details',
}: Readonly<{ tab?: ProductTab }>) {
  return (
    <div className={css.page} aria-busy="true">
      <Container>
        <span className="visually-hidden" role="status">
          Loading product {tab}…
        </span>
        <div className={css.breadcrumbs} aria-hidden="true">
          <Block className={css.crumb} />
          <Block className={css.crumb} />
          <Block className={css.crumbWide} />
        </div>
        <div className={css.card} aria-hidden="true">
          <div className={css.tabs}>
            {Array.from({ length: 4 }, (_, index) => (
              <Block key={index} className={css.tab} />
            ))}
          </div>
          <div className={css.header}>
            <Block className={css.headerIcon} />
            <div className={css.headerText}>
              <Block className={css.heading} />
              <Block className={css.description} />
            </div>
          </div>
          {tab === 'details' ? (
            <div className={css.details}>
              <Block className={css.image} />
              <div className={css.information}>
                <Block className={css.rating} />
                {Array.from({ length: 3 }, (_, index) => (
                  <div className={css.infoRow} key={index}>
                    <Block className={css.label} />
                    <Block className={css.value} />
                  </div>
                ))}
                <div className={css.payment}>
                  <Block className={css.paymentCard} />
                  <Block className={css.paymentCard} />
                </div>
                <Block className={css.action} />
              </div>
            </div>
          ) : tab === 'pharmacies' ? (
            <>
              <div className={css.filters}>
                <Block className={css.filter} />
                <Block className={css.filter} />
              </div>
              <div className={css.offerCards}>
                {Array.from({ length: 2 }, (_, index) => (
                  <div className={css.offerCard} key={index}>
                    <Block className={css.offerPhoto} />
                    <div className={css.offerInfo}>
                      <Block className={css.heading} />
                      {Array.from({ length: 3 }, (_, row) => (
                        <Block className={css.offerLine} key={row} />
                      ))}
                    </div>
                    <div className={css.offerPrice}>
                      <Block className={css.heading} />
                      <Block className={css.action} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : tab === 'characteristics' ? (
            <div className={css.sectionCard}>
              {Array.from({ length: 4 }, (_, index) => (
                <div className={css.infoRow} key={index}>
                  <Block className={css.label} />
                  <Block className={css.value} />
                </div>
              ))}
              <Block className={css.description} />
              <Block className={css.offerLine} />
            </div>
          ) : (
            <div className={css.sectionCard}>
              <Block className={css.rating} />
              <Block className={css.reviewField} />
              <Block className={css.offerLine} />
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
