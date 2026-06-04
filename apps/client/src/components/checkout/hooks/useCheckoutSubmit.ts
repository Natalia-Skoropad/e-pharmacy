import { useState } from 'react'; import { useRouter } from 'next/navigation';  import { dispatchCartUpdated } from '@/lib/cart/cart-events'; import { groupCartByStore } from '@/lib/cart/cart-groups'; import { getStockValidationError } from '@/lib/checkout'; import { APP_ERROR_MESSAGES, getAppErrorMessage } from '@/lib/errors'; import { buildCustomerOrderPath } from '@/lib/orders'; import { checkoutOrder, getCart } from '@e-pharmacy/api-client/client';
import type { Cart } from '@e-pharmacy/types';

import type {
  CheckoutDeliveryMethod,
  CheckoutPaymentMethod,
  CheckoutStoreOrderGroup,
} from '@e-pharmacy/types/checkout';

//===================================================================

type UseCheckoutSubmitParams = {
  sessionMarker: string | null | undefined;
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
  sessionMarker,
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
    if (!sessionMarker || !canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError('');

      if (!selectedOrderGroup) return;

      const latestCartResponse = await getCart();
      const latestGroups = groupCartByStore(latestCartResponse.cart);
      const latestOrderGroup = latestGroups.find(
        (group) => group.storeId === selectedOrderGroup.storeId
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
        }
      );
      const nextCartResponse = await getCart();

      setCart(nextCartResponse.cart);
      dispatchCartUpdated(nextCartResponse.cart);
      router.push(buildCustomerOrderPath(response.order));
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
