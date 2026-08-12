'use client';

import { useId, useState } from 'react';

import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs, TabPanel } from '@e-pharmacy/ui/navigation';
import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';
import type { Review } from '@e-pharmacy/types/reviews';

import { useClientAuthCapabilities, useClipboardAction } from '@/hooks';
import { buildProductCatalogPath } from '@/lib/catalog/product-catalog';
import { ROUTES } from '@/lib/routes';

import { PharmacyAboutPanel } from './PharmacyAboutPanel';
import { PharmacyBankDetailsPanel } from './PharmacyBankDetailsPanel';
import { PharmacyDetailsHero } from './PharmacyDetailsHero';
import { PharmacyDetailsTabs, type PharmacyTab } from './PharmacyDetailsTabs';
import { PharmacyReviewsPanel } from './PharmacyReviewsPanel';
import { usePharmacyBankDetails } from './usePharmacyBankDetails';

import css from '@/components/catalog/detail-page.module.css';

//===================================================================

export type PharmacyDetailsPageContentProps = Readonly<{
  pharmacy: PublicPharmacy;
  reviews: readonly Review[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
}>;

//===================================================================

function PharmacyDetailsPageContent({
  pharmacy,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
}: PharmacyDetailsPageContentProps) {
  const { canUseClientFeatures, isActivePharmacyUser } =
    useClientAuthCapabilities();

  const canShowBankDetails = canUseClientFeatures || isActivePharmacyUser;
  const [activeTab, setActiveTab] = useState<PharmacyTab>('details');
  const generatedTabsId = useId();
  const tabsIdBase = `pharmacy-details-${generatedTabsId.replace(/:/g, '')}`;
  const clipboard = useClipboardAction();

  const bankDetails = usePharmacyBankDetails(pharmacy.id, pharmacy.bankDetails);

  const currentTab: PharmacyTab =
    activeTab === 'payment' && !canShowBankDetails ? 'details' : activeTab;

  const productsHref = buildProductCatalogPath(
    { pharmacyId: pharmacy.id, availability: 'in-stock' },
    [pharmacy]
  );

  const handleTabChange = (nextTab: PharmacyTab) => {
    if (currentTab === 'payment' && nextTab !== 'payment') {
      bankDetails.cancel();
    }

    if (nextTab === 'payment') {
      if (!canShowBankDetails) {
        setActiveTab('details');
        return;
      }

      void bankDetails.load();
    }

    setActiveTab(nextTab);
  };

  return (
    <main className={css.page}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {clipboard.statusMessage}
      </p>

      <section className={css.hero}>
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Pharmacies', href: ROUTES.PHARMACIES },
              { label: pharmacy.name },
            ]}
            includeStructuredData
          />

          <PharmacyDetailsTabs
            idBase={tabsIdBase}
            activeValue={currentTab}
            reviewsTotal={reviewsTotal}
            canShowBankDetails={canShowBankDetails}
            onChange={handleTabChange}
          />

          <TabPanel
            idBase={tabsIdBase}
            value="details"
            activeValue={currentTab}
          >
            <PharmacyDetailsHero
              pharmacy={pharmacy}
              reviewsTotal={reviewsTotal}
              productsHref={productsHref}
              onCopy={clipboard.copy}
            />
          </TabPanel>
        </Container>
      </section>

      <Container>
        {canShowBankDetails ? (
          <TabPanel
            className={css.tabSection}
            idBase={tabsIdBase}
            value="payment"
            activeValue={currentTab}
          >
            <PharmacyBankDetailsPanel
              state={bankDetails.state}
              onRetry={() => void bankDetails.retry()}
              onCopy={clipboard.copy}
            />
          </TabPanel>
        ) : null}

        <TabPanel
          className={css.tabSection}
          idBase={tabsIdBase}
          value="about"
          activeValue={currentTab}
        >
          <PharmacyAboutPanel pharmacy={pharmacy} />
        </TabPanel>

        <TabPanel
          className={css.tabSection}
          idBase={tabsIdBase}
          value="reviews"
          activeValue={currentTab}
        >
          <PharmacyReviewsPanel
            pharmacyId={pharmacy.id}
            reviews={reviews}
            reviewsTotal={reviewsTotal}
            areReviewsUnavailable={areReviewsUnavailable}
          />
        </TabPanel>
      </Container>
    </main>
  );
}

export default PharmacyDetailsPageContent;
