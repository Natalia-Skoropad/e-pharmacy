import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Cart } from '@e-pharmacy/types/cart';
import type { CheckoutOrderPayload } from '@e-pharmacy/types/orders';
import type { DeliveryMethod, PaymentMethod } from '@e-pharmacy/types/orders';
import { normalizePhoneInput } from '@e-pharmacy/validation/order';
import { CHECKOUT_CART_CHANGED_ERROR_CODE } from '@e-pharmacy/config/orders';
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

      const shownGroupFingerprint =
        createCheckoutGroupFingerprint(selectedOrderGroup);
      const latestGroupFingerprint =
        createCheckoutGroupFingerprint(latestOrderGroup);

      if (shownGroupFingerprint !== latestGroupFingerprint) {
        replaceCartFromServer(latestCartResponse.cart);
        setError(APP_ERROR_MESSAGES.checkout.cartChanged);
        return;
      }

      const stockError = getStockValidationError(latestOrderGroup);

      if (stockError) {
        replaceCartFromServer(latestCartResponse.cart);
        setError(stockError);
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

      if (
        isApiError(error) &&
        error.backendCode === CHECKOUT_CART_CHANGED_ERROR_CODE
      ) {
        try {
          const refreshedCart = await getCart({ signal: controller.signal });
          if (!controller.signal.aborted && mountedRef.current) {
            replaceCartFromServer(refreshedCart.cart);
          }
        } catch {
          // Preserve the checkout conflict as the primary user-facing error.
        }

        if (!controller.signal.aborted && mountedRef.current) {
          setError(APP_ERROR_MESSAGES.checkout.cartChanged);
        }
        return;
      }

      setError(
        getUserFacingErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.checkout.confirm,
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
  };
}
