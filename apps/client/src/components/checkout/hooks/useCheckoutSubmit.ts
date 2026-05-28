import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { dispatchCartUpdated } from '@/lib/cart/cart-events';
import { groupCartByStore } from '@/lib/cart/cart-groups';
import { getStockValidationError } from '@/lib/checkout';
import { buildCustomerOrderPath } from '@/lib/orders';
import { checkoutOrder, getCart } from '@/services';
import type { Cart } from '@/types';

import type {
  CheckoutDeliveryMethod,
  CheckoutPaymentMethod,
  CheckoutStoreOrderGroup,
} from '@/types/checkout';

//===================================================================

type UseCheckoutSubmitParams = {
  token: string | null | undefined;
  selectedOrderGroup: CheckoutStoreOrderGroup | null;
  paymentMethod: CheckoutPaymentMethod;
  deliveryMethod: CheckoutDeliveryMethod;
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
  token,
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
    const authToken = token;

    if (!authToken || !canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError('');

      if (!selectedOrderGroup) return;

      const latestCartResponse = await getCart(authToken);
      const latestGroups = groupCartByStore(latestCartResponse.cart);
      const latestOrderGroup = latestGroups.find(
        (group) => group.storeId === selectedOrderGroup.storeId
      );

      if (!latestOrderGroup) {
        setCart(latestCartResponse.cart);
        setError(
          'Sorry, we cannot confirm this invoice right now. While you were placing the order, these products were reserved by another customer. Please update the cart and try again.'
        );
        return;
      }

      const stockError = getStockValidationError(latestOrderGroup);

      if (stockError) {
        setCart(latestCartResponse.cart);
        setError(stockError);
        return;
      }

      const response = await checkoutOrder(
        {
          storeId: latestOrderGroup.storeId,
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
        },
        authToken
      );
      const nextCartResponse = await getCart(authToken);

      setCart(nextCartResponse.cart);
      dispatchCartUpdated(nextCartResponse.cart);
      router.push(buildCustomerOrderPath(response.order));
    } catch {
      setError('Could not confirm order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit,
  };
}
