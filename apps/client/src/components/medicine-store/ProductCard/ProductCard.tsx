import Image from 'next/image';

import { SvgIcon } from '@/components/common';

import type { Product } from '@/types';

import css from './ProductCard.module.css';

//===================================================================

type ProductCardProps = {
  product: Product;
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

function ProductCard({ product }: ProductCardProps) {
  const ratingLabel =
    typeof product.rating === 'number' ? product.rating.toFixed(1) : 'New';

  return (
    <article
      className={css.card}
      aria-labelledby={`product-${product.id}-title`}
    >
      <div className={css.imageWrap}>
        {product.imageUrl ? (
          <Image
            className={css.image}
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 33vw"
          />
        ) : (
          <div className={css.imageFallback} aria-hidden="true">
            <SvgIcon name="icon-shopping-cart" size={34} />
          </div>
        )}

        <span className={css.stockBadge}>
          {product.inStock ? 'In stock' : 'Out of stock'}
        </span>
      </div>

      <div className={css.content}>
        <div className={css.metaRow}>
          <span className={css.category}>
            {CATEGORY_LABELS[product.category]}
          </span>

          <span
            className={css.rating}
            aria-label={`Product rating ${ratingLabel}`}
          >
            <SvgIcon name="icon-star" size={16} />
            {ratingLabel}
          </span>
        </div>

        <h3 className={css.title} id={`product-${product.id}-title`}>
          {product.name}
        </h3>

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
        </dl>

        <div className={css.footer}>
          <p className={css.price}>{formatPrice(product.price)}</p>

          {product.storeName ? (
            <p className={css.storeName}>{product.storeName}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
