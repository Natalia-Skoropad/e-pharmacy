import Image from 'next/image';
import { MapPin, Phone, ShoppingBag, Star } from 'lucide-react';

import { ButtonLink, SvgIcon } from '@/components/common';

import { buildMedicinesCatalogPath } from '@/lib/catalog/medicines-catalog';
import { ROUTES } from '@/lib/constants/routes';

import type { Store } from '@/types';

import css from './StoreCard.module.css';

//===================================================================

type StoreCardProps = {
  store: Store;
};

//===================================================================

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function getProductsCountLabel(count = 0): string {
  return `${count} ${count === 1 ? 'product' : 'products'} available`;
}

//===================================================================

function StoreCard({ store }: StoreCardProps) {
  const medicinesHref = buildMedicinesCatalogPath(
    { storeId: store.id },
    [store]
  );
  const storeHref = `${ROUTES.STORES}/${slugify(store.name)}-${store.id}`;
  const ratingLabel = store.rating ? store.rating.toFixed(1) : 'New';

  return (
    <article className={css.card} aria-labelledby={`store-${store.id}-title`}>
      <div className={css.imageWrap}>
        {store.imageUrl ? (
          <Image
            className={css.image}
            src={store.imageUrl}
            alt={`${store.name} pharmacy storefront`}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 33vw"
          />
        ) : (
          <div className={css.imageFallback} aria-hidden="true">
            <SvgIcon name="icon-map-pin" size={34} />
          </div>
        )}
      </div>

      <div className={css.content}>
        <div className={css.metaRow}>
          {store.city ? <span className={css.city}>{store.city}</span> : null}

          <span
            className={css.rating}
            aria-label={`Store rating ${ratingLabel}`}
          >
            <Star size={15} aria-hidden="true" />
            {ratingLabel}
          </span>
        </div>

        <h2 className={css.title} id={`store-${store.id}-title`}>
          {store.name}
        </h2>

        <dl className={css.summaryList}>
          <div className={css.summaryItem}>
            <dt>
              <MapPin size={18} aria-hidden="true" />
              <span>Address</span>
            </dt>
            <dd>{store.address}</dd>
          </div>

          {store.phone ? (
            <div className={css.summaryItem}>
              <dt>
                <Phone size={18} aria-hidden="true" />
                <span>Phone</span>
              </dt>
              <dd>
                <a className={css.phoneLink} href={`tel:${store.phone}`}>
                  {store.phone}
                </a>
              </dd>
            </div>
          ) : null}

          <div className={css.summaryItem}>
            <dt>
              <ShoppingBag size={18} aria-hidden="true" />
              <span>Medicines</span>
            </dt>
            <dd>{getProductsCountLabel(store.availableProductsCount)}</dd>
          </div>
        </dl>

        <div className={css.footer}>
          <ButtonLink className={css.detailsLink} href={storeHref} size="sm">
            Store details
          </ButtonLink>

          <ButtonLink className={css.detailsLink} href={medicinesHref} size="sm">
            View medicines
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

export default StoreCard;
