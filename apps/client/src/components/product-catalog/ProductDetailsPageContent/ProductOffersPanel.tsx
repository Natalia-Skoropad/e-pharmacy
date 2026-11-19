'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Info, Trash2, X } from 'lucide-react';

import { LinkPagination } from '@e-pharmacy/ui/navigation';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';

import type { ProductDetails, ProductOffer } from '@e-pharmacy/types/products';

import { useClientAuthCapabilities } from '@/hooks';
import { useFavorites } from '@/providers/FavoritesProvider';

import { getProductDetails } from '@/lib/api/browser/products.api';
import { buildProductPath } from '@/lib/routes';

import {
  buildProductOffersPath,
  getProductOffersHeading,
} from '@/lib/catalog/product-offers-paths';

import { CartOrderLimitModal } from '@/components/common';
import { ClientStockConflictModal } from '@/components/common/ClientStockConflictModal/ClientStockConflictModal';

import { ProductOfferList } from './ProductOfferList';
import { ProductOffersToolbar } from './ProductOffersToolbar';
import { useProductOfferCart } from './useProductOfferCart';
import { useProductOffersView } from './useProductOffersView';
import { ProductOfferResultsSkeleton } from './ProductOfferResultsSkeleton';

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

  const [refreshedOffers, setRefreshedOffers] = useState<{
    productId: string;
    offers: readonly ProductOffer[];
  } | null>(null);

  const [offersLoadState, setOffersLoadState] = useState<{
    productId: string;
    status: 'ready' | 'error';
  } | null>(null);

  // Availability is volatile while public product metadata is cached. Before
  // rendering an interactive counter, read the current stock via the BFF.
  useEffect(() => {
    const controller = new AbortController();

    void getProductDetails(product.id, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((latest) => {
        if (controller.signal.aborted) return;

        setRefreshedOffers({
          productId: product.id,
          offers: latest.product.offers,
        });

        setOffersLoadState({ productId: product.id, status: 'ready' });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setOffersLoadState({ productId: product.id, status: 'error' });
        }
      });

    return () => controller.abort();
  }, [product.id]);

  const isOffersLoading = offersLoadState?.productId !== product.id;

  const isOffersUnavailable =
    !isOffersLoading && offersLoadState?.status === 'error';

  const offers =
    refreshedOffers?.productId === product.id
      ? refreshedOffers.offers
      : product.offers;

  const favoritePharmacyIds = useMemo(() => {
    const useFavoriteCollection = favoriteCollectionStatus === 'ready';

    return new Set(
      offers
        .filter((offer) =>
          useFavoriteCollection
            ? isFavorite('pharmacy', offer.pharmacyId)
            : offer.pharmacyIsFavorite
        )
        .map((offer) => offer.pharmacyId)
    );
  }, [favoriteCollectionStatus, isFavorite, offers]);

  const [stockConflict, setStockConflict] = useState<{
    pharmacyId: string;
    pharmacyName: string;
    requested: number;
    available: number | null;
  } | null>(null);

  const handleStockConflict = async (
    offer: ProductOffer,
    requested: number
  ) => {
    setStockConflict({
      pharmacyId: offer.pharmacyId,
      pharmacyName: offer.pharmacyName,
      requested,
      available: null,
    });

    try {
      const latest = await getProductDetails(product.id, { cache: 'no-store' });

      setRefreshedOffers({
        productId: product.id,
        offers: latest.product.offers,
      });

      const current = latest.product.offers.find(
        (item) => item.pharmacyId === offer.pharmacyId
      );

      setStockConflict((previous) =>
        previous?.pharmacyId === offer.pharmacyId
          ? { ...previous, available: current?.availableQuantity ?? 0 }
          : previous
      );
    } catch {
      // Do not present the old value as an authoritative current balance.
    }
  };

  const view = useProductOffersView(
    offers,
    contextPharmacyId,
    favoritePharmacyIds
  );

  const heading = getProductOffersHeading(
    product.name,
    view.filters,
    offers.find((offer) => offer.pharmacyId === view.filters.pharmacyId)
      ?.pharmacyName
  );

  const cart = useProductOfferCart(
    product.id,
    canUseClientFeatures,
    handleStockConflict
  );

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
        offers={offers}
        productId={product.id}
        baseProductPath={productHref}
        contextPharmacyId={contextPharmacyId}
        filters={view.filters}
        shown={view.visibleOffers.length}
        total={view.filteredOffers.length}
      />

      {isOffersLoading ? (
        <ProductOfferResultsSkeleton />
      ) : isOffersUnavailable ? (
        <ProfileResourceState
          variant="error"
          title="Pharmacy stock could not be updated"
          description="Current availability could not be verified. Refresh the page before adding this product."
          onRetry={() => window.location.reload()}
          retryLabel="Refresh page"
        />
      ) : view.visibleOffers.length > 0 ? (
        <ProductOfferList
          offers={view.visibleOffers}
          getOfferState={getOfferState}
        />
      ) : (
        <ProfileResourceState
          variant="empty"
          icon={<Building2 size={24} aria-hidden="true" />}
          title={
            view.hasActiveFilters
              ? 'No matching pharmacies'
              : 'No pharmacies available'
          }
          description={
            view.hasActiveFilters
              ? 'No pharmacies match this search or location. Try changing or resetting the filters.'
              : 'No pharmacy currently offers this product.'
          }
          headingLevel={3}
        />
      )}

      {!isOffersLoading && !isOffersUnavailable && view.totalPages > 1 ? (
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

      {stockConflict ? (
        <ClientStockConflictModal
          products={[
            {
              productId: product.id,
              name: product.name,
              imageUrl: product.imageUrl,
              requested: stockConflict.requested,
              available: stockConflict.available,
            },
          ]}
          description={`Another order has reserved some or all of this product at ${stockConflict.pharmacyName}. The pharmacy availability has been refreshed where possible.`}
          confirmLabel="Review availability"
          cancelLabel="Keep browsing"
          onConfirm={() => setStockConflict(null)}
          onCancel={() => setStockConflict(null)}
        />
      ) : null}
      {cart.isOrderLimitOpen ? (
        <CartOrderLimitModal onClose={cart.closeOrderLimit} />
      ) : null}
      {cart.pendingRemoveOffer ? (
        <ConfirmationModal
          eyebrow="CART PRODUCT"
          title="Remove product from order?"
          text={`This is the last unit of ${product.name} from ${cart.pendingRemoveOffer.pharmacyName}. It will be removed from the cart.`}
          confirmLabel="Remove product"
          cancelLabel="Keep product"
          destructive
          confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
          cancelIconLeft={<X size={17} aria-hidden="true" />}
          isLoading={cart.pendingOfferIds.has(cart.pendingRemoveOffer.id)}
          onConfirm={() => void cart.confirmRemoveUnit()}
          onCancel={cart.closeRemoveConfirmation}
        />
      ) : null}
    </div>
  );
}
