import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Cart, CheckoutOrderPayload } from '@e-pharmacy/types';
import type { DeliveryMethod, PaymentMethod } from '@e-pharmacy/types/orders';

import { dispatchCartUpdated } from '@/lib/cart/cart-events';
import { groupCartByPharmacy } from '@/lib/cart/cart-groups';
import type { CartPharmacyGroup } from '@/lib/cart/cart-groups';
import { getStockValidationError } from '@/lib/checkout';
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
  setCart: (cart: Cart) => void;
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
  setCart,
  setError,
}: UseCheckoutSubmitParams) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated || !canSubmit || isSubmitting) return;

    let shouldResetSubmitting = true;

    try {
      setIsSubmitting(true);
      setError('');

      if (!selectedOrderGroup) return;

      const latestCartResponse = await getCart();
      const latestGroups = groupCartByPharmacy(latestCartResponse.cart);
      const latestOrderGroup = latestGroups.find(
        (group) => group.pharmacyId === selectedOrderGroup.pharmacyId
      );

      if (!latestOrderGroup) {
        setCart(latestCartResponse.cart);
        setError(APP_ERROR_MESSAGES.checkout.staleOrder);
        return;
      }

      const stockError = getStockValidationError(latestOrderGroup);

      if (stockError) {
        setCart(latestCartResponse.cart);
        setError(stockError);
        return;
      }

      const trimmedComment = comment.trim();
      const orderPayload: CheckoutOrderPayload =
        deliveryMethod === 'postal_delivery'
          ? {
              pharmacyId: latestOrderGroup.pharmacyId,
              paymentMethod,
              deliveryMethod,
              deliveryDetails: {
                recipientName: recipientNameValue.trim(),
                recipientPhone: recipientPhoneValue.trim(),
                address: deliveryAddressValue.trim(),
              },
              ...(trimmedComment ? { comment: trimmedComment } : {}),
            }
          : {
              pharmacyId: latestOrderGroup.pharmacyId,
              paymentMethod,
              deliveryMethod,
              ...(trimmedComment ? { comment: trimmedComment } : {}),
            };

      const response = await checkoutOrder(orderPayload);

      setCart(response.cart);
      dispatchCartUpdated(response.cart);
      shouldResetSubmitting = false;
      router.push(buildOrderPath(response.order));
    } catch (error) {
      setError(
        getUserFacingErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.checkout.confirm,
        })
      );
    } finally {
      if (shouldResetSubmitting) setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit,
  };
}
