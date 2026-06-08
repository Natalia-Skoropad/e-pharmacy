import {
  buildAddressError,
  buildNameError,
  buildOrderCommentError,
  buildPhoneError,
} from '../shared';

//===================================================================

export type CheckoutDeliveryMethod = 'pickup' | 'post';

export type CheckoutDeliveryFormValues = {
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  comment: string;
};

export type CheckoutDeliveryFormErrors = Partial<
  Record<keyof CheckoutDeliveryFormValues, string>
>;

//===================================================================

export const CHECKOUT_DELIVERY_INITIAL_VALUES: CheckoutDeliveryFormValues = {
  recipientName: '',
  recipientPhone: '',
  deliveryAddress: '',
  comment: '',
};

//===================================================================

export function validateCheckoutDeliveryForm(
  values: CheckoutDeliveryFormValues,
  deliveryMethod: CheckoutDeliveryMethod
): CheckoutDeliveryFormErrors {
  const errors: CheckoutDeliveryFormErrors = {};

  const commentError = buildOrderCommentError(values.comment, {
    trailingDot: true,
  });

  if (commentError) errors.comment = commentError;

  if (deliveryMethod === 'pickup') return errors;

  const nameError = buildNameError(values.recipientName, {
    required: true,
    trailingDot: true,
  });
  const phoneError = buildPhoneError(values.recipientPhone, {
    required: true,
    trailingDot: true,
  });
  const addressError = buildAddressError(values.deliveryAddress, {
    required: true,
    trailingDot: true,
  });

  if (nameError) errors.recipientName = nameError;
  if (phoneError) errors.recipientPhone = phoneError;
  if (addressError) errors.deliveryAddress = addressError;

  return errors;
}

//===================================================================

export function isCheckoutDeliveryFormValid(
  values: CheckoutDeliveryFormValues,
  deliveryMethod: CheckoutDeliveryMethod
): boolean {
  return (
    Object.keys(validateCheckoutDeliveryForm(values, deliveryMethod)).length === 0
  );
}
