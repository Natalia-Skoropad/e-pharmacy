import { ButtonLink, Container } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import StoresList from '@/components/stores/StoresList';

import { STORES_DESCRIPTION, STORES_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { createBreadcrumbs } from '@/lib/routes';

import type { Store } from '@/types';

import css from './StoresPageContent.module.css';

//===================================================================

type StoresPageContentProps = {
  stores: Store[];
  total: number;
  isUnavailable?: boolean;
};

//===================================================================

function StoresPageContent({
  stores,
  total,
  isUnavailable = false,
}: StoresPageContentProps) {
  const storesCountLabel = total === 1 ? '1 store' : `${total} stores`;

  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="stores-title">
        <Container>
          <Breadcrumbs items={createBreadcrumbs(STORES_TITLE)} />

          <div className={css.heroGrid}>
            <div className={css.heroContent}>
              <p className={css.kicker}>Trusted pharmacy network</p>

              <h1 className={css.title} id="stores-title">
                {STORES_TITLE}
              </h1>

              <p className={css.text}>{STORES_DESCRIPTION}</p>

              <div className={css.actions}>
                <ButtonLink href={ROUTES.MEDICINE_STORE}>
                  Browse medicines
                </ButtonLink>
              </div>
            </div>

            <div className={css.summaryCard} aria-label="Stores summary">
              <span className={css.summaryValue}>{storesCountLabel}</span>
              <span className={css.summaryText}>
                available for online orders
              </span>
            </div>
          </div>
        </Container>
      </section>

      <section
        className={css.storesSection}
        aria-labelledby="stores-list-title"
      >
        <Container>
          <div className={css.sectionHeader}>
            <div>
              <p className={css.sectionKicker}>Choose a pharmacy</p>
              <h2 className={css.sectionTitle} id="stores-list-title">
                Available stores
              </h2>
            </div>

            <p className={css.resultCount}>{storesCountLabel}</p>
          </div>

          {isUnavailable ? (
            <div className={css.notice} role="status">
              Stores are temporarily unavailable. Please check that the backend
              API is running.
            </div>
          ) : null}

          <StoresList stores={stores} />
        </Container>
      </section>
    </main>
  );
}

export default StoresPageContent;
