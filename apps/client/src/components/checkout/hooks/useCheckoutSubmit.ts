import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { dispatchCartUpdated } from '@/lib/cart/cart-events';
import { groupCartByPharmacy } from '@/lib/cart/cart-groups';
import { getStockValidationError } from '@/lib/checkout';
import { APP_ERROR_MESSAGES, getAppErrorMessage } from '@/lib/errors';
import { buildClientOrderPath } from '@/lib/orders';

import { checkoutOrder, getCart } from '@e-pharmacy/api-client/client';
import type { Cart } from '@e-pharmacy/types';

import type {
  CheckoutPaymentMethod,
  CheckoutPharmacyOrderGroup,
} from '@e-pharmacy/types/checkout';

import type { OrderDeliveryMethod } from '@e-pharmacy/types/orders';

//===================================================================

type UseCheckoutSubmitParams = {
  isAuthenticated: boolean;
  selectedOrderGroup: CheckoutPharmacyOrderGroup | null;
  paymentMethod: CheckoutPaymentMethod;
  deliveryMethod: OrderDeliveryMethod;
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
        setError(APP_ERROR_MESSAGES.checkout.staleInvoice);
        return;
      }

      const stockError = getStockValidationError(latestOrderGroup);

      if (stockError) {
        setCart(latestCartResponse.cart);
        setError(stockError);
        return;
      }

      const response = await checkoutOrder({
        pharmacyId: latestOrderGroup.pharmacyId,
        paymentMethod,
        deliveryMethod,
        ...(deliveryMethod === 'post'
          ? {
              deliveryDetails: {
                recipientName: recipientNameValue.trim(),
                recipientPhone: recipientPhoneValue.trim(),
                address: deliveryAddressValue.trim(),
              },
            }
          : {}),
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      const nextCartResponse = await getCart();

      setCart(nextCartResponse.cart);
      dispatchCartUpdated(nextCartResponse.cart);
      router.push(buildClientOrderPath(response.order));
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
