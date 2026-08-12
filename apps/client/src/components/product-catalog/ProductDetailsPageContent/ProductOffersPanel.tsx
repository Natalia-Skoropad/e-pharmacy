'use client';

import { useEffect, useMemo } from 'react';

import { CountLabel } from '@e-pharmacy/ui/data-display';
import { LazyLoadButton } from '@e-pharmacy/ui/primitives';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import type { ProductDetails, ProductOffer } from '@e-pharmacy/types/products';

import { useClientAuthCapabilities } from '@/hooks';
import { useFavorites } from '@/providers/FavoritesProvider';

import { CartOrderLimitModal } from '@/components/common';

import { ProductOfferList } from './ProductOfferList';
import { ProductOffersToolbar } from './ProductOffersToolbar';
import { useProductOfferCart } from './useProductOfferCart';
import { useProductOffersView } from './useProductOffersView';

import css from './ProductOffersPanel.module.css';

//===================================================================

export type ProductOffersPanelProps = Readonly<{
  product: ProductDetails;
  contextPharmacyId?: string;
}>;

//===================================================================

export function ProductOffersPanel({
  product,
  contextPharmacyId,
}: ProductOffersPanelProps) {
  const { canUseClientFeatures, isBootstrapping, isActivePharmacyUser } =
    useClientAuthCapabilities();

  const { getCollectionStatus, isFavorite, loadCollection } = useFavorites();
  const favoriteCollectionStatus = getCollectionStatus('pharmacy');

  useEffect(() => {
    if (!canUseClientFeatures) return;
    void loadCollection('pharmacy').catch(() => undefined);
  }, [canUseClientFeatures, loadCollection]);

  const favoritePharmacyIds = useMemo(() => {
    const useFavoriteCollection = favoriteCollectionStatus === 'ready';

    return new Set(
      product.offers
        .filter((offer) =>
          useFavoriteCollection
            ? isFavorite('pharmacy', offer.pharmacyId)
            : offer.pharmacyIsFavorite
        )
        .map((offer) => offer.pharmacyId)
    );
  }, [favoriteCollectionStatus, isFavorite, product.offers]);

  const view = useProductOffersView(
    product.offers,
    contextPharmacyId,
    favoritePharmacyIds
  );

  const cart = useProductOfferCart(product.id, canUseClientFeatures);

  const isProductAvailable = view.availableOffers.length > 0;

  const emptyTitle = isProductAvailable
    ? 'No pharmacies found'
    : 'This product is currently unavailable in pharmacies.';

  const emptyText = isProductAvailable
    ? view.hasActiveFilters
      ? 'Try changing the pharmacy name, city, or address search.'
      : 'No pharmacies match the current offers list.'
    : 'There are no pharmacies where this product is currently available.';

  const getOfferState = (offer: ProductOffer) => {
    const cartItem = cart.getCartItem(offer.id);

    return {
      productName: product.name,
      cartItem,
      pendingQuantity: cart.pendingOfferQuantities[offer.id],
      isPending: cart.pendingOfferIds.has(offer.id),
      isItemPending: cartItem ? cart.pendingItemIds.has(cartItem.id) : false,
      canUseCart: canUseClientFeatures,
      canShowStock: canUseClientFeatures,
      isFavoritePharmacy: favoritePharmacyIds.has(offer.pharmacyId),
      onIncrement: () => void cart.addUnit(offer),
      onDecrement: () => void cart.removeUnit(offer),
    } as const;
  };

  return (
    <div className={css.panel}>
      <div className={css.header}>
        <div className={css.headerMain}>
          <h2 className={css.title}>Pharmacies</h2>

          {!isBootstrapping && !canUseClientFeatures ? (
            <p className={css.authNote}>
              {isActivePharmacyUser
                ? 'Ordering is available only for client accounts.'
                : 'Only logged-in clients can add products to an order.'}
            </p>
          ) : null}
        </div>

        <CountLabel
          shown={view.visibleOffers.length}
          total={view.filteredOffers.length}
          label="pharmacies"
        />
      </div>

      <ProductOffersToolbar
        isOpen={view.areFiltersOpen}
        pharmacyNameQuery={view.pharmacyNameQuery}
        pharmacyAddressQuery={view.pharmacyAddressQuery}
        cityFilter={view.cityFilter}
        cityOptions={view.cityOptions}
        offerSort={view.offerSort}
        sanitizeSearchValue={view.sanitizeSearchValue}
        onToggle={view.toggleFilters}
        onPharmacyNameChange={view.setPharmacyNameQuery}
        onPharmacyAddressChange={view.setPharmacyAddressQuery}
        onCityChange={view.setCityFilter}
        onSortChange={view.setOfferSort}
      />

      {view.visibleOffers.length > 0 ? (
        <ProductOfferList
          offers={view.visibleOffers}
          getOfferState={getOfferState}
        />
      ) : (
        <div className={css.emptyPanel}>
          <h3 className={css.emptyTitle}>{emptyTitle}</h3>
          <p className={css.emptyText}>{emptyText}</p>
        </div>
      )}

      <LazyLoadButton
        visibleCount={view.visibleOffers.length}
        totalCount={view.filteredOffers.length}
        label="Show more pharmacies"
        onLoadMore={view.showMore}
      />

      {cart.isOrderLimitOpen ? (
        <CartOrderLimitModal onClose={cart.closeOrderLimit} />
      ) : null}

      {cart.pendingRemoveOffer ? (
        <ConfirmationModal
          title="Remove product from order?"
          text={`This is the last unit of ${product.name} from ${cart.pendingRemoveOffer.pharmacyName}. It will be removed from the cart.`}
          isLoading={cart.pendingOfferIds.has(cart.pendingRemoveOffer.id)}
          onConfirm={() => void cart.confirmRemoveUnit()}
          onCancel={cart.closeRemoveConfirmation}
        />
      ) : null}
    </div>
  );
}
