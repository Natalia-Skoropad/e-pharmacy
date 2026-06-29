'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  Button,
  ButtonLink,
  PictureUpload,
  StatusBadge,
  StatusBanner,
} from '@e-pharmacy/ui/common';

import type { Product } from '@e-pharmacy/types';
import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import { getProductDetails } from '@/lib/api/browser';
import { getPharmacyAllProductsPath } from '@/lib/pharmacy/routes';

import css from './AllProductDetailsPageContent.module.css';

//===================================================================

type AllProductDetailsPageContentProps = Readonly<{
  productId: string;
  backHref?: string;
  backLabel?: string;
  pageDescription?: string;
  bannerTitle?: string;
  bannerMessage?: string;
  productKicker?: string;
  showAddAction?: boolean;
}>;

const CATEGORY_LABELS = {
  medicine: 'Medicine',
  vitamins: 'Vitamins',
  beauty: 'Beauty',
  hygiene: 'Hygiene',
  medical_devices: 'Medical devices',
  other: 'Other',
} as const;

//===================================================================

const DEFAULT_PAGE_DESCRIPTION =
  'View real Admin product data. Adding products to your pharmacy is locked while the pharmacy status is new.';

const DEFAULT_BANNER_TITLE = 'Adding this product is locked';

const DEFAULT_BANNER_MESSAGE =
  'You can review active Admin product details now. Add-to-my-pharmacy actions unlock after Admin verifies your pharmacy profile.';

//===================================================================

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

//===================================================================

function AllProductDetailsPageContent({
  productId,
  backHref = getPharmacyAllProductsPath(),
  backLabel = 'Back to all products',
  pageDescription = DEFAULT_PAGE_DESCRIPTION,
  bannerTitle = DEFAULT_BANNER_TITLE,
  bannerMessage = DEFAULT_BANNER_MESSAGE,
  productKicker = 'Admin product',
  showAddAction = true,
}: AllProductDetailsPageContentProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getProductDetails(productId);
        if (isMounted) setProduct(response.product);
      } catch (loadError) {
        if (isMounted) {
          setError(
            getErrorMessage(loadError, 'Could not load product details.')
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  return (
    <main className={css.page} aria-labelledby="global-product-page-title">
      <div className={css.pageHeader}>
        <h1 className={css.title} id="global-product-page-title">
          {product ? product.name : 'Global product'}
        </h1>
        <p className={css.pageDescription}>{pageDescription}</p>
      </div>

      <div className={css.contentCard}>
        <div className={css.stack}>
          <StatusBanner
            status="new"
            label="New"
            title={bannerTitle}
            message={bannerMessage}
          />

          {isLoading ? (
            <section className={css.card} aria-busy="true">
              <p className={css.muted}>Loading real product details...</p>
            </section>
          ) : null}

          {error ? (
            <StatusBanner
              status="rejected"
              title="Product could not be loaded"
              message={error}
            />
          ) : null}

          {product ? (
            <section
              className={css.detailsGrid}
              aria-labelledby="product-title"
            >
              <div className={css.visualCard}>
                {product.imageUrl ? (
                  <PictureUpload
                    className={css.image}
                    src={product.imageUrl}
                    alt={product.name}
                  />
                ) : (
                  <div className={css.imagePlaceholder} aria-hidden="true">
                    {product.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className={css.card}>
                <div className={css.headerRow}>
                  <div>
                    <p className={css.kicker}>{productKicker}</p>
                    <h2 className={css.productTitle} id="product-title">
                      {product.name}
                    </h2>
                  </div>
                  <StatusBadge status={product.status} />
                </div>

                <dl className={css.detailsList}>
                  <div>
                    <dt>Article</dt>
                    <dd>{product.article}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{CATEGORY_LABELS[product.category]}</dd>
                  </div>
                  <div>
                    <dt>Average price</dt>
                    <dd>{formatPrice(product.price)}</dd>
                  </div>
                  <div>
                    <dt>In pharmacies</dt>
                    <dd>{product.availableInPharmaciesCount}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatShortDate(product.updatedAt)}</dd>
                  </div>
                  {product.manufacturer ? (
                    <div>
                      <dt>Manufacturer</dt>
                      <dd>{product.manufacturer}</dd>
                    </div>
                  ) : null}
                  {product.dosage ? (
                    <div>
                      <dt>Dosage</dt>
                      <dd>{product.dosage}</dd>
                    </div>
                  ) : null}
                  {product.packageQuantity ? (
                    <div>
                      <dt>Package</dt>
                      <dd>{product.packageQuantity}</dd>
                    </div>
                  ) : null}
                </dl>

                {product.description ? (
                  <p className={css.description}>{product.description}</p>
                ) : null}

                <div className={css.actions}>
                  {showAddAction ? (
                    <Button type="button" disabled>
                      Add to my pharmacy after verification
                    </Button>
                  ) : null}

                  <ButtonLink
                    href={backHref}
                    variant="secondary"
                    renderLink={({ href, className, children, ...props }) => (
                      <Link href={href} className={className} {...props}>
                        {children}
                      </Link>
                    )}
                  >
                    {backLabel}
                  </ButtonLink>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default AllProductDetailsPageContent;
export { AllProductDetailsPageContent };
