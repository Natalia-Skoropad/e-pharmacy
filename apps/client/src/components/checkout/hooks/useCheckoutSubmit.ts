import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Cart } from '@e-pharmacy/types/cart';
import type { CheckoutOrderPayload } from '@e-pharmacy/types/orders';
import type { DeliveryMethod, PaymentMethod } from '@e-pharmacy/types/orders';
import { normalizePhoneInput } from '@e-pharmacy/validation/order';

import {
  CHECKOUT_CART_CHANGED_ERROR_CODE,
  CHECKOUT_GROUP_MISSING_ERROR_CODE,
  PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE,
  PHARMACY_UNAVAILABLE_ERROR_CODE,
} from '@e-pharmacy/config/orders';

import { STOCK_CHANGED_ERROR_CODE } from '@e-pharmacy/config/cart';
import { isApiError } from '@e-pharmacy/api-client/transport';

import { groupCartByPharmacy } from '@/lib/cart/cart-groups';
import type { CartPharmacyGroup } from '@/lib/cart/cart-groups';
import { getStockValidationError } from '@/lib/checkout/checkout-utils';
import { createCheckoutGroupFingerprint } from '@/lib/checkout/checkout-group-fingerprint';
import { APP_ERROR_MESSAGES, getUserFacingErrorMessage } from '@/lib/errors';
import { buildOrderPath } from '@/lib/routes';
import { checkoutOrder, getCart } from '@/lib/api/browser';

//===================================================================

type UseCheckoutSubmitParams = {
  isAuthenticated: boolean;
  selectedOrderGroup: CartPharmacyGroup | null;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  recipientNameValue: string;
  recipientPhoneValue: string;
  deliveryAddressValue: string;
  comment: string;
  canSubmit: boolean;
  replaceCartFromServer: (cart: Cart) => void;
  setError: (message: string) => void;
};

//===================================================================

export function useCheckoutSubmit({
  isAuthenticated,
  selectedOrderGroup,
  paymentMethod,
  deliveryMethod,
  recipientNameValue,
  recipientPhoneValue,
  deliveryAddressValue,
  comment,
  canSubmit,
  replaceCartFromServer,
  setError,
}: UseCheckoutSubmitParams) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [priceChanges, setPriceChanges] = useState<
    readonly Readonly<{
      productName: string;
      previousPrice: number;
      currentPrice: number;
    }>[]
  >([]);

  const [stockChanges, setStockChanges] = useState<
    readonly Readonly<{
      productId: string;
      productName: string;
      imageUrl?: string;
      requested: number;
      available: number;
    }>[]
  >([]);

  const [stockConflictOpen, setStockConflictOpen] = useState(false);

  const submitLockRef = useRef(false);
  const activeControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      submitLockRef.current = false;
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
    };
  }, []);

  const handleSubmit = async () => {
    if (!isAuthenticated || !canSubmit || submitLockRef.current) return;
    if (!selectedOrderGroup) return;

    submitLockRef.current = true;

    const controller = new AbortController();

    activeControllerRef.current?.abort();
    activeControllerRef.current = controller;

    let shouldResetSubmitting = true;

    try {
      setIsSubmitting(true);
      setError('');

      const latestCartResponse = await getCart({ signal: controller.signal });

      if (controller.signal.aborted) return;

      const latestGroups = groupCartByPharmacy(latestCartResponse.cart);

      const latestOrderGroup = latestGroups.find(
        (group) => group.pharmacyId === selectedOrderGroup.pharmacyId
      );

      if (!latestOrderGroup) {
        replaceCartFromServer(latestCartResponse.cart);
        setError(APP_ERROR_MESSAGES.checkout.staleOrder);

        return;
      }

      const stockError = getStockValidationError(latestOrderGroup);

      if (stockError) {
        replaceCartFromServer(latestCartResponse.cart);

        setStockChanges(
          latestOrderGroup.items
            .filter((item) => item.stockQuantity < item.quantity)
            .map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              imageUrl: item.product.imageUrl,
              requested: item.quantity,
              available: item.stockQuantity,
            }))
        );

        setStockConflictOpen(true);
        return;
      }

      const shownGroupFingerprint =
        createCheckoutGroupFingerprint(selectedOrderGroup);

      const latestGroupFingerprint =
        createCheckoutGroupFingerprint(latestOrderGroup);

      if (shownGroupFingerprint !== latestGroupFingerprint) {
        const oldByOffer = new Map(
          selectedOrderGroup.items.map((item) => [item.productOfferId, item])
        );

        const changes = latestOrderGroup.items.flatMap((item) => {
          const previous = oldByOffer.get(item.productOfferId);

          return previous && previous.unitPrice !== item.unitPrice
            ? [
                {
                  productName: item.product.name,
                  previousPrice: previous.unitPrice,
                  currentPrice: item.unitPrice,
                },
              ]
            : [];
        });

        replaceCartFromServer(latestCartResponse.cart);

        if (changes.length > 0) {
          setPriceChanges(changes);
          return;
        }

        setError(APP_ERROR_MESSAGES.checkout.cartChanged);

        return;
      }

      const trimmedComment = comment.trim();

      const orderPayload: CheckoutOrderPayload =
        deliveryMethod === 'postal_delivery'
          ? {
              pharmacyId: latestOrderGroup.pharmacyId,
              expectedCartRevision: latestCartResponse.cart.revision,
              groupFingerprint: latestGroupFingerprint,
              paymentMethod,
              deliveryMethod,

              deliveryDetails: {
                recipientName: recipientNameValue.trim(),
                recipientPhone: normalizePhoneInput(recipientPhoneValue),
                address: deliveryAddressValue.trim(),
              },

              ...(trimmedComment ? { comment: trimmedComment } : {}),
            }
          : {
              pharmacyId: latestOrderGroup.pharmacyId,
              expectedCartRevision: latestCartResponse.cart.revision,
              groupFingerprint: latestGroupFingerprint,
              paymentMethod,
              deliveryMethod,

              ...(trimmedComment ? { comment: trimmedComment } : {}),
            };

      const response = await checkoutOrder(orderPayload, {
        signal: controller.signal,
      });

      if (controller.signal.aborted || !mountedRef.current) return;

      replaceCartFromServer(response.cart);
      shouldResetSubmitting = false;
      router.push(buildOrderPath(response.order));
    } catch (error) {
      if (controller.signal.aborted || !mountedRef.current) return;

      if (isApiError(error) && error.backendCode === STOCK_CHANGED_ERROR_CODE) {
        try {
          const refreshedCart = await getCart({ signal: controller.signal });

          if (!controller.signal.aborted && mountedRef.current) {
            replaceCartFromServer(refreshedCart.cart);

            const refreshedGroup = groupCartByPharmacy(refreshedCart.cart).find(
              (group) => group.pharmacyId === selectedOrderGroup.pharmacyId
            );

            setStockChanges(
              (refreshedGroup?.items ?? [])
                .filter((item) => item.stockQuantity < item.quantity)
                .map((item) => ({
                  productId: item.productId,
                  productName: item.product.name,
                  imageUrl: item.product.imageUrl,
                  requested: item.quantity,
                  available: item.stockQuantity,
                }))
            );
          }
        } catch {
          setStockChanges([]);
        }

        if (!controller.signal.aborted && mountedRef.current) {
          setStockConflictOpen(true);
        }

        return;
      }

      if (
        isApiError(error) &&
        error.backendCode === CHECKOUT_CART_CHANGED_ERROR_CODE
      ) {
        try {
          const refreshedCart = await getCart({ signal: controller.signal });

          if (!controller.signal.aborted && mountedRef.current) {
            const refreshedGroup = groupCartByPharmacy(refreshedCart.cart).find(
              (group) => group.pharmacyId === selectedOrderGroup.pharmacyId
            );

            const oldByOffer = new Map(
              selectedOrderGroup.items.map((item) => [
                item.productOfferId,
                item,
              ])
            );

            const changes =
              refreshedGroup?.items.flatMap((item) => {
                const previous = oldByOffer.get(item.productOfferId);

                return previous && previous.unitPrice !== item.unitPrice
                  ? [
                      {
                        productName: item.product.name,
                        previousPrice: previous.unitPrice,
                        currentPrice: item.unitPrice,
                      },
                    ]
                  : [];
              }) ?? [];

            replaceCartFromServer(refreshedCart.cart);

            if (changes.length > 0) setPriceChanges(changes);
            else setError(APP_ERROR_MESSAGES.checkout.cartChanged);
          }
        } catch {
          if (!controller.signal.aborted && mountedRef.current)
            setError(APP_ERROR_MESSAGES.checkout.cartChanged);
        }

        return;
      }

      setError(
        getUserFacingErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.checkout.confirm,
          backendCodeMessages: {
            [CHECKOUT_GROUP_MISSING_ERROR_CODE]:
              APP_ERROR_MESSAGES.checkout.groupMissing,

            [STOCK_CHANGED_ERROR_CODE]:
              APP_ERROR_MESSAGES.checkout.stockChanged,

            [PHARMACY_UNAVAILABLE_ERROR_CODE]:
              APP_ERROR_MESSAGES.checkout.pharmacyUnavailable,

            [PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE]:
              APP_ERROR_MESSAGES.checkout.paymentUnavailable,
          },
        })
      );
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
        submitLockRef.current = false;

        if (shouldResetSubmitting && mountedRef.current) {
          setIsSubmitting(false);
        }
      }
    }
  };

  return {
    isSubmitting,
    handleSubmit,
    priceChanges,
    dismissPriceChanges: () => setPriceChanges([]),
    stockChanges,
    stockConflictOpen,
    dismissStockConflict: () => setStockConflictOpen(false),
  };
}
