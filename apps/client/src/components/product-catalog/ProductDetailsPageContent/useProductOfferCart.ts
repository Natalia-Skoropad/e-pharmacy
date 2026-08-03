'use client';

import { useState } from 'react';

import type { Cart } from '@e-pharmacy/types/cart';
import type { ProductOffer } from '@e-pharmacy/types/products';
import { useToast } from '@e-pharmacy/ui/feedback';

import { isCartOrderLimitError } from '@/lib/cart/order-limit';
import { APP_ERROR_MESSAGES, getUserFacingErrorMessage } from '@/lib/errors';
import { useCart } from '@/providers/CartProvider';

//===================================================================

function getOfferCartItem(cart: Cart | null, productOfferId: string) {
  return (
    cart?.items.find((item) => item.productOfferId === productOfferId) ?? null
  );
}

//===================================================================

export function useProductOfferCart(productId: string, canUseCart: boolean) {
  const {
    cart,
    pendingItemIds,
    pendingOfferIds,
    addProductToCart,
    updateItemQuantity,
    removeItemFromCart,
  } = useCart();

  const toast = useToast();

  const [pendingOfferQuantities, setPendingOfferQuantities] = useState<
    Record<string, number>
  >({});

  const [pendingRemoveOffer, setPendingRemoveOffer] =
    useState<ProductOffer | null>(null);

  const [isOrderLimitOpen, setIsOrderLimitOpen] = useState(false);

  const addUnit = async (offer: ProductOffer) => {
    if (!canUseCart || !offer.inStock || pendingOfferIds.has(offer.id)) return;

    const cartItem = getOfferCartItem(cart, offer.id);
    const nextQuantity = (cartItem?.quantity ?? 0) + 1;

    if (!cartItem) {
      setPendingOfferQuantities((current) => ({
        ...current,
        [offer.id]: nextQuantity,
      }));
    }

    try {
      const response = cartItem
        ? await updateItemQuantity(
            cartItem.id,
            { quantity: nextQuantity },
            { offerId: offer.id }
          )
        : await addProductToCart(
            {
              productId,
              pharmacyId: offer.pharmacyId,
              quantity: 1,
            },
            { offerId: offer.id }
          );

      if (response) toast.success('One product unit was added to the order.');
    } catch (error) {
      if (isCartOrderLimitError(error)) {
        setIsOrderLimitOpen(true);
      } else {
        toast.error(
          getUserFacingErrorMessage(error, {
            fallback: APP_ERROR_MESSAGES.products.addToCart,
          })
        );
      }
    } finally {
      if (!cartItem) {
        setPendingOfferQuantities((current) => {
          const next = { ...current };
          delete next[offer.id];
          return next;
        });
      }
    }
  };

  const confirmRemoveUnit = async () => {
    const offer = pendingRemoveOffer;
    if (!offer || !canUseCart || pendingOfferIds.has(offer.id)) return;

    const cartItem = getOfferCartItem(cart, offer.id);
    if (!cartItem) return;

    try {
      const response = await removeItemFromCart(cartItem.id, {
        offerId: offer.id,
      });

      if (response)
        toast.success('One product unit was removed from the order.');
    } catch (error) {
      toast.error(
        getUserFacingErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.products.removeFromCart,
        })
      );
    } finally {
      setPendingRemoveOffer(null);
    }
  };

  const removeUnit = async (offer: ProductOffer) => {
    if (!canUseCart || !offer.inStock || pendingOfferIds.has(offer.id)) return;

    const cartItem = getOfferCartItem(cart, offer.id);
    if (!cartItem) return;

    if (cartItem.quantity === 1) {
      setPendingRemoveOffer(offer);
      return;
    }

    try {
      const response = await updateItemQuantity(
        cartItem.id,
        { quantity: cartItem.quantity - 1 },
        { offerId: offer.id }
      );

      if (response)
        toast.success('One product unit was removed from the order.');
    } catch (error) {
      toast.error(
        getUserFacingErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.products.removeFromCart,
        })
      );
    }
  };

  return {
    cart,
    pendingItemIds,
    pendingOfferIds,
    pendingOfferQuantities,
    pendingRemoveOffer,
    isOrderLimitOpen,
    getCartItem: (offerId: string) => getOfferCartItem(cart, offerId),
    addUnit,
    removeUnit,
    confirmRemoveUnit,
    closeRemoveConfirmation: () => setPendingRemoveOffer(null),
    closeOrderLimit: () => setIsOrderLimitOpen(false),
  } as const;
}
