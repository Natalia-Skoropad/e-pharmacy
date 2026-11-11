import { Container } from '@e-pharmacy/ui/layout';

import css from './PharmacyDetailsLoading.module.css';

//===================================================================

export type PharmacyLoadingTab = 'details' | 'payment' | 'about' | 'reviews';

//===================================================================

function Placeholder({ className = '' }: Readonly<{ className?: string }>) {
  return <span className={`${css.shimmer} ${className}`} />;
}

//===================================================================

/** Layout-aligned skeleton for the public pharmacy details and its tabs. */
export function PharmacyDetailsLoading({
  tab = 'details',
}: Readonly<{ tab?: PharmacyLoadingTab }>) {
  return (
    <div className={css.page} aria-busy="true">
      <Container>
        <span className="visually-hidden" role="status">
          Loading pharmacy {tab === 'payment' ? 'bank details' : tab}…
        </span>
        <div className={css.breadcrumbs} aria-hidden="true">
          <Placeholder className={css.crumbShort} />
          <Placeholder className={css.crumbShort} />
          <Placeholder className={css.crumbLong} />
        </div>

        <div className={css.tabsCard} aria-hidden="true">
          <div className={css.tabs}>
            {Array.from({ length: 4 }, (_, index) => (
              <Placeholder className={css.tab} key={index} />
            ))}
          </div>

          <div className={css.panel}>
            <div className={css.heading}>
              <Placeholder className={css.icon} />
              <div className={css.headingText}>
                <Placeholder className={css.title} />
                <Placeholder className={css.subtitle} />
              </div>
            </div>

            {tab === 'details' ? (
              <div className={css.details}>
                <Placeholder className={css.image} />
                <div className={css.info}>
                  <Placeholder className={css.rating} />
                  {Array.from({ length: 5 }, (_, index) => (
                    <div className={css.infoRow} key={index}>
                      <Placeholder className={css.infoLabel} />
                      <Placeholder className={css.infoValue} />
                    </div>
                  ))}
                  <Placeholder className={css.action} />
                </div>
              </div>
            ) : tab === 'about' ? (
              <div className={css.contentCard}>
                <Placeholder className={css.paragraphTitle} />
                {Array.from({ length: 5 }, (_, index) => (
                  <Placeholder
                    className={index === 4 ? css.paragraphShort : css.paragraph}
                    key={index}
                  />
                ))}
              </div>
            ) : tab === 'reviews' ? (
              <div className={css.contentCard}>
                <Placeholder className={css.paragraphTitle} />
                <Placeholder className={css.reviewField} />
                <Placeholder className={css.paragraphShort} />
                <Placeholder className={css.action} />
              </div>
            ) : (
              <div className={css.contentCard}>
                {Array.from({ length: 6 }, (_, index) => (
                  <div className={css.infoRow} key={index}>
                    <Placeholder className={css.infoLabel} />
                    <Placeholder className={css.infoValue} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
