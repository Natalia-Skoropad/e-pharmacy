import Image from 'next/image';

import { ButtonLink, SvgIcon } from '@/components/common';

import { ROUTES } from '@/lib/constants/routes';

import type { Store } from '@/types';

import css from './StoreCard.module.css';

//===================================================================

type StoreCardProps = {
  store: Store;
};

//===================================================================

function StoreCard({ store }: StoreCardProps) {
  const medicineStoreHref = `${ROUTES.MEDICINES_CATALOG}?storeId=${store.id}`;
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
        <div className={css.header}>
          <div>
            {store.city ? <p className={css.city}>{store.city}</p> : null}

            <h2 className={css.title} id={`store-${store.id}-title`}>
              {store.name}
            </h2>
          </div>

          <span
            className={css.rating}
            aria-label={`Store rating ${ratingLabel}`}
          >
            <SvgIcon name="icon-star" size={16} />
            {ratingLabel}
          </span>
        </div>

        <p className={css.address}>
          <SvgIcon name="icon-map-pin" size={18} />
          {store.address}
        </p>

        {store.description ? (
          <p className={css.description}>{store.description}</p>
        ) : null}

        {store.phone ? (
          <a className={css.phone} href={`tel:${store.phone}`}>
            <SvgIcon name="icon-phone" size={18} />
            {store.phone}
          </a>
        ) : null}

        <ButtonLink className={css.link} href={medicineStoreHref} size="sm">
          View medicines
        </ButtonLink>
      </div>
    </article>
  );
}

export default StoreCard;
