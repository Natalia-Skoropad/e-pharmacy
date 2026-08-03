'use client';

import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { useToast } from '@e-pharmacy/ui/feedback';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { SvgIcon } from '@e-pharmacy/ui/primitives';
import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import { useClientAuthCapabilities, useFavoriteActions } from '@/hooks';

import {
  getFavoriteActionCopy,
  shouldRenderFavoriteControl,
} from '@/lib/favorites/favorite-presentation';

import { FavoriteToggleButton } from '@/components/common';

import { PharmacyContactPanel } from './PharmacyContactPanel';
import css from './PharmacyDetailsHero.module.css';

//===================================================================

export type PharmacyDetailsHeroProps = Readonly<{
  pharmacy: PublicPharmacy;
  reviewsTotal: number;
  productsHref: string;
  onCopy: (value: string, label: string) => Promise<boolean>;
}>;

//===================================================================

export function PharmacyDetailsHero({
  pharmacy,
  reviewsTotal,
  productsHref,
  onCopy,
}: PharmacyDetailsHeroProps) {
  const toast = useToast();

  const { isAuthenticated, isBootstrapping, canUseClientFeatures } =
    useClientAuthCapabilities();

  const { isFavorite, isFavoriteLoading, isFavoritePending, toggleFavorite } =
    useFavoriteActions({
      entityType: 'pharmacy',
      id: pharmacy.id,
      notifier: toast,
      ...getFavoriteActionCopy('pharmacy'),
    });

  return (
    <div className={css.grid}>
      <div className={css.imageCard}>
        {pharmacy.imageUrl ? (
          <ShimmerImage
            className={css.image}
            src={pharmacy.imageUrl}
            alt={`${pharmacy.name} image`}
            priority
            fetchPriority="high"
            sizes="(max-width: 767px) 100vw, (max-width: 1439px) 50vw, 520px"
          />
        ) : (
          <div className={css.imageFallback} aria-hidden="true">
            <SvgIcon name="icon-map-pin" size={52} />
          </div>
        )}
      </div>

      <div className={css.content}>
        <div className={css.topLine}>
          <p className={css.kicker}>{pharmacy.city ?? 'Pharmacy profile'}</p>

          {shouldRenderFavoriteControl({
            isAuthenticated,
            isBootstrapping,
            canUseClientFeatures,
          }) ? (
            <FavoriteToggleButton
              isActive={isFavorite}
              disabled={isFavoriteLoading}
              isPending={isFavoritePending}
              onClick={toggleFavorite}
              activeLabel="Remove pharmacy from favorites"
              inactiveLabel="Add pharmacy to favorites"
            />
          ) : null}
        </div>

        <h1 className={css.title}>{pharmacy.name}</h1>

        <RatingSummary
          className={css.ratingRow}
          rating={pharmacy.rating}
          reviewsCount={reviewsTotal}
        />

        <PharmacyContactPanel
          pharmacy={pharmacy}
          productsHref={productsHref}
          onCopy={onCopy}
        />
      </div>
    </div>
  );
}
