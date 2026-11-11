'use client';

import { useId } from 'react';
import { Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Container } from '@e-pharmacy/ui/layout';
import { CategoryIcon } from '@e-pharmacy/ui/forms';
import { Breadcrumbs, TabPanel } from '@e-pharmacy/ui/navigation';

import type { ProductDetails } from '@e-pharmacy/types/products';
import type { Review } from '@e-pharmacy/types/reviews';

import {
  buildProductDetailTabPath,
  getProductDetailsBreadcrumbs,
} from '@/lib/routes/product-detail-tabs';

import { buildProductPath } from '@/lib/routes';

import { ProductCharacteristicsPanel } from './ProductCharacteristicsPanel';
import { ProductDetailsHero } from './ProductDetailsHero';
import { ProductDetailsTabs, type ProductTab } from './ProductDetailsTabs';
import { ProductOffersPanel } from './ProductOffersPanel';
import { ProductReviewsPanel } from './ProductReviewsPanel';

// Reuse the established public pharmacy detail shell without changing it.
import shellCss from '@/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsPageContent.module.css';

import css from './ProductDetailsPageContent.module.css';

//===================================================================

export type ProductDetailsPageContentProps = Readonly<{
  product: ProductDetails;
  reviews: readonly Review[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
  contextPharmacyId?: string;
  initialTab?: ProductTab;
}>;

//===================================================================

function ProductDetailsPageContent({
  product,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
  contextPharmacyId,
  initialTab = 'details',
}: ProductDetailsPageContentProps) {
  const router = useRouter();
  const generatedTabsId = useId();
  const tabsIdBase = `product-details-${generatedTabsId.replace(/:/g, '')}`;

  const productHref = buildProductPath(
    product.name,
    product.id,
    product.publicSlugId
  );

  const shortDescription =
    'Compare pharmacy prices and availability for this product.';

  const goToTab = (tab: ProductTab) => {
    router.push(
      buildProductDetailTabPath(productHref, tab, contextPharmacyId),
      {
        scroll: false,
      }
    );
  };

  return (
    <main className={shellCss.page}>
      <Container>
        <div className={shellCss.breadcrumbs}>
          <Breadcrumbs
            items={getProductDetailsBreadcrumbs(
              product.name,
              buildProductDetailTabPath(
                productHref,
                'details',
                contextPharmacyId
              ),
              initialTab
            )}
            includeStructuredData
          />
        </div>

        <div className={shellCss.tabsCard}>
          <ProductDetailsTabs
            idBase={tabsIdBase}
            activeValue={initialTab}
            onChange={goToTab}
          />

          <TabPanel
            className={shellCss.tabPanel}
            idBase={tabsIdBase}
            value="details"
            activeValue={initialTab}
          >
            <header className={shellCss.detailsHeader}>
              <span className={shellCss.detailsHeaderIcon} aria-hidden="true">
                <Package size={22} />
              </span>
              <div className={shellCss.detailsHeaderContent}>
                <div className={shellCss.detailsHeaderTitleRow}>
                  {initialTab === 'details' ? (
                    <h1 className={shellCss.detailsHeaderTitle}>
                      {product.name}
                    </h1>
                  ) : (
                    <h2 className={shellCss.detailsHeaderTitle}>
                      {product.name}
                    </h2>
                  )}
                  <span className={css.category}>
                    <CategoryIcon name={product.category.icon} size={16} />
                    {product.category.name}
                  </span>
                </div>
                {shortDescription ? (
                  <p className={shellCss.detailsHeaderDescription}>
                    {shortDescription}
                  </p>
                ) : null}
              </div>
            </header>
            <ProductDetailsHero
              product={product}
              reviewsTotal={reviewsTotal}
              onOpenOffers={() => goToTab('pharmacies')}
            />
          </TabPanel>

          <TabPanel
            className={shellCss.tabPanel}
            idBase={tabsIdBase}
            value="pharmacies"
            activeValue={initialTab}
          >
            <ProductOffersPanel
              isPageHeading={initialTab === 'pharmacies'}
              product={product}
              contextPharmacyId={contextPharmacyId}
            />
          </TabPanel>

          <TabPanel
            className={shellCss.tabPanel}
            idBase={tabsIdBase}
            value="characteristics"
            activeValue={initialTab}
          >
            <ProductCharacteristicsPanel
              product={product}
              isPageHeading={initialTab === 'characteristics'}
            />
          </TabPanel>

          <TabPanel
            className={shellCss.tabPanel}
            idBase={tabsIdBase}
            value="reviews"
            activeValue={initialTab}
          >
            <ProductReviewsPanel
              isPageHeading={initialTab === 'reviews'}
              productId={product.id}
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

export default ProductDetailsPageContent;
