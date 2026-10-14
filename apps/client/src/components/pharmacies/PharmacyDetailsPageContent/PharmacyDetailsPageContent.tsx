'use client';

import { useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';

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

import css from './PharmacyDetailsPageContent.module.css';

//===================================================================

export type PharmacyDetailsPageContentProps = Readonly<{
  pharmacy: PublicPharmacy;
  reviews: readonly Review[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
  initialTab?: PharmacyTab;
}>;

//===================================================================

function PharmacyDetailsPageContent({
  pharmacy,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
  initialTab = 'details',
}: PharmacyDetailsPageContentProps) {
  const {
    canUseClientFeatures,
    isActivePharmacyUser,
    isActiveAdminUser,
    isBootstrapping,
  } = useClientAuthCapabilities();

  const canShowBankDetails =
    canUseClientFeatures || isActivePharmacyUser || isActiveAdminUser;

  const router = useRouter();
  const generatedTabsId = useId();
  const tabsIdBase = `pharmacy-details-${generatedTabsId.replace(/:/g, '')}`;
  const clipboard = useClipboardAction();

  const {
    state: bankDetailsState,
    load: loadBankDetails,
    retry: retryBankDetails,
    cancel: cancelBankDetails,
  } = usePharmacyBankDetails(pharmacy.id);

  useEffect(() => {
    if (initialTab === 'payment' && !canShowBankDetails && !isBootstrapping) {
      router.replace(`/${pharmacy.publicSlugId}`, { scroll: false });
    }
  }, [
    initialTab,
    canShowBankDetails,
    isBootstrapping,
    pharmacy.publicSlugId,
    router,
  ]);

  useEffect(() => {
    if (initialTab === 'payment' && canShowBankDetails) {
      void loadBankDetails();
    } else {
      cancelBankDetails();
    }
  }, [initialTab, canShowBankDetails, loadBankDetails, cancelBankDetails]);

  const currentTab: PharmacyTab =
    initialTab === 'payment' && !canShowBankDetails ? 'details' : initialTab;

  const productsHref = buildProductCatalogPath(
    { pharmacyId: pharmacy.id, availability: 'in-stock' },
    [pharmacy]
  );

  const handleTabChange = (nextTab: PharmacyTab) => {
    if (nextTab === 'payment' && !canShowBankDetails) return;
    const base = `/${pharmacy.publicSlugId}`;

    const path =
      nextTab === 'details'
        ? base
        : `${base}/${nextTab === 'payment' ? 'bank-details' : nextTab}`;
    router.push(path, { scroll: false });
  };

  return (
    <main className={css.page}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {clipboard.statusMessage}
      </p>

      <Container>
        <div className={css.breadcrumbs}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Pharmacies', href: ROUTES.PHARMACIES },
              { label: pharmacy.name },
            ]}
            includeStructuredData
          />
        </div>

        <div className={css.tabsCard}>
          <PharmacyDetailsTabs
            idBase={tabsIdBase}
            activeValue={currentTab}
            reviewsTotal={reviewsTotal}
            canShowBankDetails={canShowBankDetails}
            onChange={handleTabChange}
          />

          <TabPanel
            className={css.tabPanel}
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

          {canShowBankDetails ? (
            <TabPanel
              className={css.tabPanel}
              idBase={tabsIdBase}
              value="payment"
              activeValue={currentTab}
            >
              <PharmacyBankDetailsPanel
                state={bankDetailsState}
                onRetry={() => void retryBankDetails()}
                onCopy={clipboard.copy}
              />
            </TabPanel>
          ) : null}

          <TabPanel
            className={css.tabPanel}
            idBase={tabsIdBase}
            value="about"
            activeValue={currentTab}
          >
            <PharmacyAboutPanel pharmacy={pharmacy} />
          </TabPanel>

          <TabPanel
            className={css.tabPanel}
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
        </div>
      </Container>
    </main>
  );
}

export default PharmacyDetailsPageContent;
