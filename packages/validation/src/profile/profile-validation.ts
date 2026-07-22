import {
  buildUserNameError,
  buildPharmacyNameError,
  buildBankRecipientNameError,
  buildBankNameError,
  buildPhoneError,
  buildAddressError,
  buildPasswordError,
  buildRequiredPasswordError,
  buildEmailError,
  buildWorkingHoursError,
  buildTextEditorError,
  buildTaxIdError,
  buildIbanError,
  buildPaymentPurposeError,
  isValidationResultValid,
  VALIDATION_MESSAGES,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  PHARMACY_NAME_MAX_LENGTH,
  BANK_RECIPIENT_NAME_MAX_LENGTH,
  BANK_NAME_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
  WORKING_HOURS_MAX_LENGTH,
  TEXT_EDITOR_MAX_LENGTH,
  TAX_ID_MAX_LENGTH,
  IBAN_MAX_LENGTH,
  PAYMENT_PURPOSE_MAX_LENGTH,
  type FormErrors,
  type FormTouchedFields,
} from '../shared';

//===================================================================

export type DataProfileFormValues = {
  name: string;
  phone: string;
  address: string;
};

export type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
};

export type PharmacyContactFormValues = {
  name: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
};

export type PharmacyAboutFormValues = {
  description: string;
};

export type PharmacyPaymentFormValues = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  receiptEmail: string;
  paymentPurpose: string;
};

//===================================================================

export type DataProfileFormErrors = FormErrors<DataProfileFormValues>;
export type ChangePasswordFormErrors = FormErrors<ChangePasswordFormValues>;
export type PharmacyContactFormErrors = FormErrors<PharmacyContactFormValues>;
export type PharmacyAboutFormErrors = FormErrors<PharmacyAboutFormValues>;
export type PharmacyPaymentFormErrors = FormErrors<PharmacyPaymentFormValues>;
export type DataProfileTouchedFields = FormTouchedFields<DataProfileFormValues>;

export type ChangePasswordTouchedFields =
  FormTouchedFields<ChangePasswordFormValues>;

export type PharmacyContactTouchedFields =
  FormTouchedFields<PharmacyContactFormValues>;

export type PharmacyAboutTouchedFields =
  FormTouchedFields<PharmacyAboutFormValues>;

export type PharmacyPaymentTouchedFields =
  FormTouchedFields<PharmacyPaymentFormValues>;

//===================================================================

export const DATA_PROFILE_INITIAL_VALUES: DataProfileFormValues = {
  name: '',
  phone: '',
  address: '',
};

export const CHANGE_PASSWORD_INITIAL_VALUES: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
};

export const PHARMACY_CONTACT_INITIAL_VALUES: PharmacyContactFormValues = {
  name: '',
  address: '',
  phone: '',
  email: '',
  workingHours: '',
};

export const PHARMACY_ABOUT_INITIAL_VALUES: PharmacyAboutFormValues = {
  description: '',
};

export const PHARMACY_PAYMENT_INITIAL_VALUES: PharmacyPaymentFormValues = {
  recipientName: '',
  taxId: '',
  iban: '',
  bankName: '',
  receiptEmail: '',
  paymentPurpose: '',
};

//===================================================================

export const DATA_PROFILE_FORM_FIELDS: Array<keyof DataProfileFormValues> = [
  'name',
  'phone',
  'address',
];

export const CHANGE_PASSWORD_FORM_FIELDS: Array<
  keyof ChangePasswordFormValues
> = ['currentPassword', 'newPassword'];

export const PHARMACY_CONTACT_FORM_FIELDS: Array<
  keyof PharmacyContactFormValues
> = ['name', 'address', 'phone', 'email', 'workingHours'];

export const PHARMACY_ABOUT_FORM_FIELDS: Array<keyof PharmacyAboutFormValues> =
  ['description'];

export const PHARMACY_PAYMENT_FORM_FIELDS: Array<
  keyof PharmacyPaymentFormValues
> = [
  'recipientName',
  'taxId',
  'iban',
  'bankName',
  'receiptEmail',
  'paymentPurpose',
];

//===================================================================

export function normalizeDataProfileValue(value: string): string {
  return value.trim();
}

//===================================================================

export function normalizeDataProfileValues(
  values: DataProfileFormValues
): DataProfileFormValues {
  return {
    name: normalizeDataProfileValue(values.name),
    phone: normalizeDataProfileValue(values.phone),
    address: normalizeDataProfileValue(values.address),
  };
}

//===================================================================

export function isDataProfileFormDirty(
  values: DataProfileFormValues,
  initialValues: DataProfileFormValues
): boolean {
  return DATA_PROFILE_FORM_FIELDS.some(
    (field) =>
      normalizeDataProfileValue(values[field]) !==
      normalizeDataProfileValue(initialValues[field])
  );
}

//===================================================================

export function isChangePasswordFormDirty(
  values: ChangePasswordFormValues
): boolean {
  return CHANGE_PASSWORD_FORM_FIELDS.some((field) => values[field].length > 0);
}

//===================================================================

export function isDataProfileFormValid(values: DataProfileFormValues): boolean {
  return isValidationResultValid(validateDataProfileForm(values));
}

//===================================================================

export function isChangePasswordFormValid(
  values: ChangePasswordFormValues
): boolean {
  return (
    isChangePasswordFormDirty(values) &&
    isValidationResultValid(validateChangePasswordForm(values))
  );
}

//===================================================================

export function validateDataProfileForm(
  values: DataProfileFormValues
): DataProfileFormErrors {
  const errors: DataProfileFormErrors = {};

  const nameError = buildUserNameError(values.name, {
    required: true,
    trailingDot: true,
  });

  const phoneError = buildPhoneError(values.phone, {
    required: true,
    trailingDot: true,
  });

  const addressError = buildAddressError(values.address, { trailingDot: true });

  if (nameError) errors.name = nameError;
  if (phoneError) errors.phone = phoneError;
  if (addressError) errors.address = addressError;

  return errors;
}

//===================================================================

export function validateChangePasswordForm(
  values: ChangePasswordFormValues
): ChangePasswordFormErrors {
  const errors: ChangePasswordFormErrors = {};
  const currentPassword = values.currentPassword;
  const newPassword = values.newPassword;

  if (!currentPassword && !newPassword) return errors;

  const currentPasswordError = buildRequiredPasswordError(
    currentPassword,
    VALIDATION_MESSAGES.required.currentPassword
  );

  if (currentPasswordError) errors.currentPassword = currentPasswordError;

  const newPasswordError = buildPasswordError(newPassword);
  if (newPasswordError) errors.newPassword = newPasswordError;

  return errors;
}

//===================================================================

export function isPharmacyContactFormDirty(
  values: PharmacyContactFormValues,
  initialValues: PharmacyContactFormValues
): boolean {
  return PHARMACY_CONTACT_FORM_FIELDS.some(
    (field) => values[field].trim() !== initialValues[field].trim()
  );
}

//===================================================================

export function isPharmacyAboutFormDirty(
  values: PharmacyAboutFormValues,
  initialValues: PharmacyAboutFormValues
): boolean {
  return PHARMACY_ABOUT_FORM_FIELDS.some(
    (field) => values[field].trim() !== initialValues[field].trim()
  );
}

//===================================================================

export function isPharmacyPaymentFormDirty(
  values: PharmacyPaymentFormValues,
  initialValues: PharmacyPaymentFormValues
): boolean {
  return PHARMACY_PAYMENT_FORM_FIELDS.some(
    (field) => values[field].trim() !== initialValues[field].trim()
  );
}

//===================================================================

export function validatePharmacyContactForm(
  values: PharmacyContactFormValues
): PharmacyContactFormErrors {
  const errors: PharmacyContactFormErrors = {};

  const nameError = buildPharmacyNameError(values.name, {
    required: true,
    trailingDot: true,
  });

  const addressError = buildAddressError(values.address, {
    required: true,
    trailingDot: true,
  });

  const phoneError = buildPhoneError(values.phone, {
    required: true,
    trailingDot: true,
  });

  const emailError = buildEmailError(values.email);

  const workingHoursError = buildWorkingHoursError(values.workingHours, {
    required: true,
    trailingDot: true,
  });

  if (nameError) errors.name = nameError;
  if (addressError) errors.address = addressError;
  if (phoneError) errors.phone = phoneError;
  if (emailError) errors.email = emailError;
  if (workingHoursError) errors.workingHours = workingHoursError;

  return errors;
}

//===================================================================

export function validatePharmacyAboutForm(
  values: PharmacyAboutFormValues
): PharmacyAboutFormErrors {
  const errors: PharmacyAboutFormErrors = {};

  const descriptionError = buildTextEditorError(values.description, {
    required: true,
    trailingDot: true,
  });

  if (descriptionError) errors.description = descriptionError;

  return errors;
}

//===================================================================

export function validatePharmacyPaymentForm(
  values: PharmacyPaymentFormValues
): PharmacyPaymentFormErrors {
  const errors: PharmacyPaymentFormErrors = {};

  const recipientNameError = buildBankRecipientNameError(values.recipientName, {
    required: true,
    trailingDot: true,
  });

  const taxIdError = buildTaxIdError(values.taxId, {
    required: true,
    trailingDot: true,
  });

  const ibanError = buildIbanError(values.iban, {
    required: true,
    trailingDot: true,
  });

  const bankNameError = buildBankNameError(values.bankName, {
    required: true,
    trailingDot: true,
  });

  const receiptEmailError = buildEmailError(values.receiptEmail);

  const paymentPurposeError = buildPaymentPurposeError(values.paymentPurpose, {
    required: true,
    trailingDot: true,
  });

  if (recipientNameError) errors.recipientName = recipientNameError;
  if (taxIdError) errors.taxId = taxIdError;
  if (ibanError) errors.iban = ibanError;
  if (bankNameError) errors.bankName = bankNameError;
  if (receiptEmailError) errors.receiptEmail = receiptEmailError;
  if (paymentPurposeError) errors.paymentPurpose = paymentPurposeError;

  return errors;
}

//===================================================================

export {
  USER_NAME_MAX_LENGTH,
  PHARMACY_NAME_MAX_LENGTH,
  BANK_RECIPIENT_NAME_MAX_LENGTH,
  BANK_NAME_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
  WORKING_HOURS_MAX_LENGTH,
  TEXT_EDITOR_MAX_LENGTH,
  TAX_ID_MAX_LENGTH,
  IBAN_MAX_LENGTH,
  PAYMENT_PURPOSE_MAX_LENGTH,
};
