import Image from 'next/image';

import { ButtonLink, Container, SvgIcon } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ProductReviewsList from '@/components/product-details/ProductReviewsList';

import { ROUTES } from '@/lib/constants/routes';

import type { Product, ProductReview } from '@/types';

import css from './ProductDetailsPageContent.module.css';

//===================================================================

type ProductDetailsPageContentProps = {
  product: Product;
  reviews: ProductReview[];
  reviewsTotal: number;
  areReviewsUnavailable?: boolean;
};

//===================================================================

const CATEGORY_LABELS: Record<Product['category'], string> = {
  medicine: 'Medicine',
  vitamins: 'Vitamins',
  beauty: 'Beauty',
  hygiene: 'Hygiene',
  'medical-devices': 'Medical devices',
  other: 'Other',
};

//===================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(price);
}

//===================================================================

function ProductDetailsPageContent({
  product,
  reviews,
  reviewsTotal,
  areReviewsUnavailable = false,
}: ProductDetailsPageContentProps) {
  const ratingLabel =
    typeof product.rating === 'number' ? product.rating.toFixed(1) : 'New';

  const reviewsCountLabel =
    reviewsTotal === 1 ? '1 review' : `${reviewsTotal} reviews`;

  const storeHref = `${ROUTES.MEDICINE_STORE}?storeId=${product.storeId}`;

  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="product-title">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: ROUTES.HOME },
              { label: 'Medicine Store', href: ROUTES.MEDICINE_STORE },
              { label: product.name },
            ]}
          />

          <div className={css.grid}>
            <div className={css.imageCard}>
              {product.imageUrl ? (
                <Image
                  className={css.image}
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 520px"
                />
              ) : (
                <div className={css.imageFallback} aria-hidden="true">
                  <SvgIcon name="icon-shopping-cart" size={52} />
                </div>
              )}

              <span className={css.stockBadge}>
                {product.inStock ? 'In stock' : 'Out of stock'}
              </span>
            </div>

            <div className={css.content}>
              <p className={css.category}>
                {CATEGORY_LABELS[product.category]}
              </p>

              <h1 className={css.title} id="product-title">
                {product.name}
              </h1>

              <div className={css.ratingRow}>
                <span
                  className={css.rating}
                  aria-label={`Product rating ${ratingLabel}`}
                >
                  <SvgIcon name="icon-star" size={18} />
                  {ratingLabel}
                </span>

                <span className={css.reviewsCount}>{reviewsCountLabel}</span>
              </div>

              {product.description ? (
                <p className={css.description}>{product.description}</p>
              ) : null}

              <dl className={css.details}>
                {product.manufacturer ? (
                  <div className={css.detailItem}>
                    <dt>Manufacturer</dt>
                    <dd>{product.manufacturer}</dd>
                  </div>
                ) : null}

                {product.dosage ? (
                  <div className={css.detailItem}>
                    <dt>Dosage</dt>
                    <dd>{product.dosage}</dd>
                  </div>
                ) : null}

                {product.packageQuantity ? (
                  <div className={css.detailItem}>
                    <dt>Package</dt>
                    <dd>{product.packageQuantity}</dd>
                  </div>
                ) : null}

                {product.storeName ? (
                  <div className={css.detailItem}>
                    <dt>Pharmacy</dt>
                    <dd>{product.storeName}</dd>
                  </div>
                ) : null}
              </dl>

              <div className={css.purchaseBox}>
                <p className={css.price}>{formatPrice(product.price)}</p>

                <div className={css.actions}>
                  <ButtonLink href={ROUTES.CART}>Add to cart soon</ButtonLink>

                  <ButtonLink href={storeHref} variant="secondary">
                    View pharmacy
                  </ButtonLink>
                </div>

                <p className={css.note}>
                  Cart actions will be connected in the next cart integration
                  stage.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className={css.reviewsSection} aria-labelledby="reviews-title">
        <Container>
          <div className={css.sectionHeader}>
            <div>
              <p className={css.sectionKicker}>Customer feedback</p>

              <h2 className={css.sectionTitle} id="reviews-title">
                Product reviews
              </h2>
            </div>

            <p className={css.resultCount}>{reviewsCountLabel}</p>
          </div>

          {areReviewsUnavailable ? (
            <div className={css.notice} role="status">
              Reviews are temporarily unavailable. Please check that the backend
              API is running.
            </div>
          ) : null}

          <ProductReviewsList reviews={reviews} />
        </Container>
      </section>
    </main>
  );
}

export default ProductDetailsPageContent;
