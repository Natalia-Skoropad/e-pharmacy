import { ArrowRight, Trash2 } from 'lucide-react';

import type { ProductDetails, ProductOffer } from '@e-pharmacy/types/products';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';
import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

import {
  PRODUCT_STATUS_PRESENTATION,
  PHARMACY_STATUS_PRESENTATION,
} from '@e-pharmacy/config/presentation';

import { formatShortDate } from '@e-pharmacy/utils/date';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { Button } from '@e-pharmacy/ui/primitives';
import { StatusBadge, StatusBanner } from '@e-pharmacy/ui/statistics';
import { CategoryIcon } from '@e-pharmacy/ui/forms';
import { ShimmerImage } from '@e-pharmacy/ui/media';

import { getPharmacyAllProductPath } from '@/lib/routes';
import { getProductImageSrc } from '@/lib/products/product-images';
import { resolveOwnerCatalogCategory } from '@/lib/products/owner-catalog-category';
import { getLockedFeatureBannerStatus } from '@/lib/pharmacies/current-pharmacy-status';

import css from './OwnProductDetailsPageContent.module.css';

//===================================================================

type OwnProductDetailsTabProps = Readonly<{
  product: ProductDetails;
  currentOffer: ProductOffer | null;
  pharmacyStatus: PharmacyStatus | null;
  categories: readonly ProductCategoryReference[];
  canRemove: boolean;
  removing: boolean;
  onRemove: () => void;
}>;

//===================================================================

export function OwnProductDetailsTab({
  product,
  currentOffer,
  pharmacyStatus,
  categories,
  canRemove,
  removing,
  onRemove,
}: OwnProductDetailsTabProps) {
  const bannerStatus = getLockedFeatureBannerStatus(pharmacyStatus);

  const dateAdded =
    currentOffer?.createdAt ??
    product.offers.reduce<string | null>(
      (earliest, offer) =>
        offer.createdAt && (!earliest || offer.createdAt < earliest)
          ? offer.createdAt
          : earliest,
      null
    );

  const imageSrc = getProductImageSrc(product.imageUrl);

  return (
    <div className={css.detailsTab}>
      {bannerStatus ? (
        <StatusBanner
          {...PHARMACY_STATUS_PRESENTATION[bannerStatus]}
          title={
            bannerStatus === 'blocked'
              ? 'Product management is unavailable'
              : 'Product management is locked for now'
          }
          message={
            bannerStatus === 'blocked'
              ? 'Your pharmacy is temporarily blocked. Product details remain visible, but catalog, price, and stock mutations are disabled until Admin restores access.'
              : 'You can review product details now. Price and stock management unlock after Admin verifies your pharmacy profile.'
          }
        />
      ) : null}
      <section className={css.detailsGrid} aria-label="Product summary">
        <div className={css.visualCard}>
          {imageSrc ? (
            <span className={css.imageFrame}>
              <ShimmerImage
                className={css.image}
                src={imageSrc}
                alt={product.name}
                sizes="(min-width: 1440px) 420px, 90vw"
                unoptimized
              />
            </span>
          ) : (
            <div className={css.imagePlaceholder} aria-hidden="true">
              {product.name.charAt(0)}
            </div>
          )}
        </div>

        <div className={css.card}>
          <dl className={css.adminMetadata}>
            <div className={css.adminMetadataItem}>
              <dt>Status</dt>
              <dd>
                <StatusBadge {...PRODUCT_STATUS_PRESENTATION[product.status]} />
              </dd>
            </div>

            <div className={css.adminMetadataItem}>
              <dt>Category</dt>
              <dd>
                <span className={css.productCategoryDisplay}>
                  <span className={css.productCategoryIcon}>
                    <CategoryIcon
                      name={
                        resolveOwnerCatalogCategory(
                          product.category,
                          categories
                        ).icon
                      }
                      size={16}
                    />
                  </span>
                  <span>{product.category.name}</span>
                </span>
              </dd>
            </div>
            <div className={css.adminMetadataItem}>
              <dt>Article</dt>
              <dd>{product.article}</dd>
            </div>
            <div className={css.adminMetadataItem}>
              <dt>Product ID</dt>
              <dd>{product.id}</dd>
            </div>
            <div className={css.adminMetadataItem}>
              <dt>Admin last update date</dt>
              <dd>{formatShortDate(product.updatedAt) ?? '—'}</dd>
            </div>
            <div className={css.adminMetadataItem}>
              <dt>Date added to pharmacy</dt>
              <dd>{dateAdded ? (formatShortDate(dateAdded) ?? '—') : '—'}</dd>
            </div>
          </dl>

          <div className={`${css.actions} ${css.ownProductActions}`}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={`${css.actionButton} ${css.removeButton}`}
              iconLeft={<Trash2 size={17} aria-hidden="true" />}
              disabled={!canRemove}
              isLoading={removing}
              loadingLabel="Removing product..."
              onClick={onRemove}
            >
              Remove from my pharmacy
            </Button>
            <LinkButton
              href={getPharmacyAllProductPath(product.id)}
              className={`${css.actionButton} ${css.ownProductLink}`}
              size="sm"
              iconRight={<ArrowRight size={16} aria-hidden="true" />}
            >
              Open global product
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
