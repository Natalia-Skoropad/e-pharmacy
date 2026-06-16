import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { dispatchCartUpdated } from '@/lib/cart/cart-events';
import { groupCartByPharmacy } from '@/lib/cart/cart-groups';
import { getStockValidationError } from '@/lib/checkout';
import { APP_ERROR_MESSAGES, getAppErrorMessage } from '@/lib/errors';
import { buildOrderPath } from '@/lib/orders';

import { checkoutOrder, getCart } from '@e-pharmacy/api-client/client';
import type { Cart, CheckoutOrderPayload } from '@e-pharmacy/types';

import type { CheckoutPharmacyOrderGroup } from '@e-pharmacy/types/checkout';
import type { PaymentMethod } from '@e-pharmacy/types/orders';
import type { DeliveryMethod } from '@e-pharmacy/types/orders';

//===================================================================

type UseCheckoutSubmitParams = {
  isAuthenticated: boolean;
  selectedOrderGroup: CheckoutPharmacyOrderGroup | null;
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
      const nextCartResponse = await getCart();

      setCart(nextCartResponse.cart);
      dispatchCartUpdated(nextCartResponse.cart);
      router.push(buildOrderPath(response.order));
    } catch (error) {
      setError(
        getAppErrorMessage(error, {
          fallback: APP_ERROR_MESSAGES.checkout.confirm,
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit,
  };
}
