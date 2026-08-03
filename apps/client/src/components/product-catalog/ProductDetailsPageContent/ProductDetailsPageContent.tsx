'use client';

import { useId, useMemo, useState } from 'react';

import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs, TabPanel } from '@e-pharmacy/ui/navigation';

import type { ProductDetails } from '@e-pharmacy/types/products';
import type { Review } from '@e-pharmacy/types/reviews';

import { ROUTES } from '@/lib/routes';

import { ProductCharacteristicsPanel } from './ProductCharacteristicsPanel';
import { ProductDetailsHero } from './ProductDetailsHero';
import { ProductDetailsTabs, type ProductTab } from './ProductDetailsTabs';
import { ProductOffersPanel } from './ProductOffersPanel';
import { ProductReviewsPanel } from './ProductReviewsPanel';

import css from '@/components/catalog/detail-page.module.css';

//===================================================================

export type ProductDetailsPageContentProps = Readonly<{
  product: ProductDetails;
  reviews: readonly Review[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
  contextPharmacyId?: string;
}>;

//===================================================================

function ProductDetailsPageContent({
  product,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
  contextPharmacyId,
}: ProductDetailsPageContentProps) {
  const [activeTab, setActiveTab] = useState<ProductTab>('about');
  const generatedTabsId = useId();
  const tabsIdBase = `product-details-${generatedTabsId.replace(/:/g, '')}`;

  const availableOffersCount = useMemo(
    () => product.offers.filter((offer) => offer.inStock).length,
    [product.offers]
  );

  return (
    <main className={css.page}>
      <section className={css.hero}>
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Product catalog', href: ROUTES.PRODUCTS_CATALOG },
              { label: product.name },
            ]}
            includeStructuredData
          />

          <ProductDetailsTabs
            idBase={tabsIdBase}
            activeValue={activeTab}
            offersCount={availableOffersCount}
            reviewsTotal={reviewsTotal}
            onChange={setActiveTab}
          />

          <TabPanel idBase={tabsIdBase} value="about" activeValue={activeTab}>
            <ProductDetailsHero
              product={product}
              reviewsTotal={reviewsTotal}
              onOpenOffers={() => setActiveTab('prices')}
            />
          </TabPanel>
        </Container>
      </section>

      <Container>
        <TabPanel
          className={css.tabSection}
          idBase={tabsIdBase}
          value="prices"
          activeValue={activeTab}
        >
          <ProductOffersPanel
            product={product}
            contextPharmacyId={contextPharmacyId}
          />
        </TabPanel>

        <TabPanel
          className={css.tabSection}
          idBase={tabsIdBase}
          value="characteristics"
          activeValue={activeTab}
        >
          <ProductCharacteristicsPanel product={product} />
        </TabPanel>

        <TabPanel
          className={css.tabSection}
          idBase={tabsIdBase}
          value="reviews"
          activeValue={activeTab}
        >
          <ProductReviewsPanel
            productId={product.id}
            reviews={reviews}
            reviewsTotal={reviewsTotal}
            areReviewsUnavailable={areReviewsUnavailable}
          />
        </TabPanel>
      </Container>
    </main>
  );
}

export default ProductDetailsPageContent;
