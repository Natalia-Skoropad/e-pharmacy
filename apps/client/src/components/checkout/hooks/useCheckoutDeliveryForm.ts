import { useMemo, useState } from 'react';

import {
  ORDER_DELIVERY_INITIAL_VALUES,
  hasValidationErrors,
  isOrderDeliveryFormValid,
  normalizePhoneInput,
  validateOrderDeliveryForm,
  type OrderDeliveryFormErrors,
  type OrderDeliveryFormValues,
  type OrderDeliveryTouchedFields,
} from '@e-pharmacy/validation';

import type { DeliveryMethod } from '@e-pharmacy/types/orders';

//===================================================================

type CheckoutDeliveryUserDefaults = Partial<
  Pick<
    OrderDeliveryFormValues,
    'recipientName' | 'recipientPhone' | 'deliveryAddress'
  >
>;

type UseCheckoutDeliveryFormParams = {
  deliveryMethod: DeliveryMethod;
  userDefaults?: CheckoutDeliveryUserDefaults;
};

//===================================================================

function normalizeDeliveryFieldValue(
  field: keyof OrderDeliveryFormValues,
  value: string
): string {
  return field === 'recipientPhone' ? normalizePhoneInput(value) : value;
}

//===================================================================

function getTouchedFieldsFromErrors(
  errors: OrderDeliveryFormErrors
): OrderDeliveryTouchedFields {
  return Object.keys(errors).reduce<OrderDeliveryTouchedFields>(
    (acc, field) => {
      acc[field as keyof OrderDeliveryFormValues] = true;
      return acc;
    },
    {}
  );
}

//===================================================================

export function useCheckoutDeliveryForm({
  deliveryMethod,
  userDefaults,
}: UseCheckoutDeliveryFormParams) {
  const [draftValues, setDraftValues] = useState<OrderDeliveryFormValues>(
    ORDER_DELIVERY_INITIAL_VALUES
  );

  const [touchedFields, setTouchedFields] =
    useState<OrderDeliveryTouchedFields>({});

  const values = useMemo<OrderDeliveryFormValues>(
    () => ({
      ...draftValues,
      recipientName: touchedFields.recipientName
        ? draftValues.recipientName
        : draftValues.recipientName || userDefaults?.recipientName || '',
      recipientPhone: touchedFields.recipientPhone
        ? draftValues.recipientPhone
        : draftValues.recipientPhone || userDefaults?.recipientPhone || '',
      deliveryAddress: touchedFields.deliveryAddress
        ? draftValues.deliveryAddress
        : draftValues.deliveryAddress || userDefaults?.deliveryAddress || '',
    }),
    [draftValues, touchedFields, userDefaults]
  );

  const errors = useMemo(
    () => validateOrderDeliveryForm(values, deliveryMethod),
    [values, deliveryMethod]
  );

  const isValid = isOrderDeliveryFormValid(values, deliveryMethod);

  const setFieldValue = (
    field: keyof OrderDeliveryFormValues,
    value: string
  ) => {
    const normalizedValue = normalizeDeliveryFieldValue(field, value);

    setTouchedFields((current) => ({
      ...current,
      [field]: true,
    }));

    setDraftValues((current) => ({
      ...current,
      [field]: normalizedValue,
    }));
  };

  const markInvalidFieldsTouched = (nextErrors: OrderDeliveryFormErrors) => {
    if (!hasValidationErrors(nextErrors)) return;

    setTouchedFields((current) => ({
      ...current,
      ...getTouchedFieldsFromErrors(nextErrors),
    }));
  };

  const resetFromUser = () => {
    setDraftValues(ORDER_DELIVERY_INITIAL_VALUES);
    setTouchedFields({});
  };

  return {
    values,
    errors,
    touchedFields,
    isValid,
    setFieldValue,
    markInvalidFieldsTouched,
    resetFromUser,
  };
}
