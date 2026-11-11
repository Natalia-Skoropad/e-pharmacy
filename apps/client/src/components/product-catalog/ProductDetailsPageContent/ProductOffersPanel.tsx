'use client';

import { useEffect, useMemo } from 'react';
import { Building2, Info } from 'lucide-react';

import { LinkPagination } from '@e-pharmacy/ui/navigation';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import type { ProductDetails, ProductOffer } from '@e-pharmacy/types/products';

import { useClientAuthCapabilities } from '@/hooks';
import { useFavorites } from '@/providers/FavoritesProvider';

import { buildProductPath } from '@/lib/routes';

import {
  buildProductOffersPath,
  getProductOffersHeading,
} from '@/lib/catalog/product-offers-paths';

import { CartOrderLimitModal } from '@/components/common';

import { ProductOfferList } from './ProductOfferList';
import { ProductOffersToolbar } from './ProductOffersToolbar';
import { useProductOfferCart } from './useProductOfferCart';
import { useProductOffersView } from './useProductOffersView';

import css from './ProductOffersPanel.module.css';

//===================================================================

export type ProductOffersPanelProps = Readonly<{
  product: ProductDetails;
  isPageHeading?: boolean;
  contextPharmacyId?: string;
}>;

//===================================================================

export function ProductOffersPanel({
  product,
  isPageHeading = false,
  contextPharmacyId,
}: ProductOffersPanelProps) {
  const {
    canUseClientFeatures,
    isBootstrapping,
    isActivePharmacyUser,
    isActiveAdminUser,
  } = useClientAuthCapabilities();

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

  const heading = getProductOffersHeading(
    product.name,
    view.filters,
    product.offers.find((offer) => offer.pharmacyId === view.filters.pharmacyId)
      ?.pharmacyName
  );

  const cart = useProductOfferCart(product.id, canUseClientFeatures);

  const productHref = buildProductPath(
    product.name,
    product.id,
    product.publicSlugId
  );

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
      <header className={css.header}>
        <span className={css.headerIcon} aria-hidden="true">
          <Building2 size={22} />
        </span>

        <div className={css.headerText}>
          {isPageHeading ? (
            <h1 className={css.title}>{heading}</h1>
          ) : (
            <h2 className={css.title}>{heading}</h2>
          )}
          <p className={css.subtitle}>
            Compare pharmacies, availability and prices for this product.
          </p>
        </div>
        {!isBootstrapping && !canUseClientFeatures ? (
          <p className={css.authNote} role="note">
            <Info size={17} aria-hidden="true" />
            {isActivePharmacyUser || isActiveAdminUser
              ? 'Ordering is available only for client accounts.'
              : 'Only logged-in clients can add products to an order.'}
          </p>
        ) : null}
      </header>

      <ProductOffersToolbar
        offers={view.availableOffers}
        productId={product.id}
        baseProductPath={productHref}
        contextPharmacyId={contextPharmacyId}
        filters={view.filters}
        shown={view.visibleOffers.length}
        total={view.filteredOffers.length}
      />

      {view.visibleOffers.length > 0 ? (
        <ProductOfferList
          offers={view.visibleOffers}
          getOfferState={getOfferState}
        />
      ) : (
        <div className={css.emptyPanel}>
          <Building2 size={28} aria-hidden="true" />
          <h3 className={css.emptyTitle}>
            {view.hasActiveFilters
              ? 'No matching pharmacies'
              : 'No pharmacies available'}
          </h3>
          <p className={css.emptyText}>
            {view.hasActiveFilters
              ? 'No pharmacy offers match the selected search or location. Change or reset the filters.'
              : 'This product is currently unavailable in pharmacies.'}
          </p>
        </div>
      )}

      {view.totalPages > 1 ? (
        <div className={css.pagination}>
          <LinkPagination
            currentPage={view.filters.page}
            totalPages={view.totalPages}
            getPageHref={(page) =>
              buildProductOffersPath(
                productHref,
                { ...view.filters, page },
                contextPharmacyId
              )
            }
            ariaLabel="Product pharmacy offers pagination"
          />
        </div>
      ) : null}

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
