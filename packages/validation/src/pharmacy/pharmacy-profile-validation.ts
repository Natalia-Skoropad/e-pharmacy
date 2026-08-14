import {
  buildAddressError,
  buildEmailError,
  buildPhoneError,
  buildTextEditorError,
  normalizeEmail,
  normalizeIban,
  normalizeOptionalText,
  normalizePhoneInput,
  BANK_NAME_MAX_LENGTH,
  BANK_RECIPIENT_NAME_MAX_LENGTH,
  IBAN_MAX_LENGTH,
  PAYMENT_PURPOSE_MAX_LENGTH,
  PHARMACY_NAME_MAX_LENGTH,
  TAX_ID_MAX_LENGTH,
  TEXT_EDITOR_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  WORKING_HOURS_MAX_LENGTH,
  type FormErrors,
  type FormTouchedFields,
} from '../shared';

import {
  buildBankNameError,
  buildBankRecipientNameError,
  buildIbanError,
  buildPaymentPurposeError,
  buildPharmacyNameError,
  buildTaxIdError,
  buildWorkingHoursError,
} from './pharmacy-field-errors';

//===================================================================

export type PharmacyValidationMode = 'draft' | 'verification';

//===================================================================

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

export type PharmacyContactPatch = {
  name?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  workingHours?: string | null;
};

export type PharmacyAboutPatch = {
  description?: string | null;
};

export type PharmacyPaymentPatch = Partial<{
  recipientName: string | null;
  taxId: string | null;
  iban: string | null;
  bankName: string | null;
  receiptEmail: string | null;
  paymentPurpose: string | null;
}>;

//===================================================================

export type PharmacyContactFormErrors = FormErrors<PharmacyContactFormValues>;
export type PharmacyAboutFormErrors = FormErrors<PharmacyAboutFormValues>;
export type PharmacyPaymentFormErrors = FormErrors<PharmacyPaymentFormValues>;

export type PharmacyContactTouchedFields =
  FormTouchedFields<PharmacyContactFormValues>;

export type PharmacyAboutTouchedFields =
  FormTouchedFields<PharmacyAboutFormValues>;

export type PharmacyPaymentTouchedFields =
  FormTouchedFields<PharmacyPaymentFormValues>;

//===================================================================

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
  values: PharmacyContactFormValues,
  mode: PharmacyValidationMode = 'verification'
): PharmacyContactFormErrors {
  const errors: PharmacyContactFormErrors = {};
  const required = mode === 'verification';

  const nameError = buildPharmacyNameError(values.name, { required });
  const addressError = buildAddressError(values.address, { required });

  const phoneError = buildPhoneError(values.phone, { required });

  const emailError =
    values.email.trim() || required ? buildEmailError(values.email) : '';

  const workingHoursError = buildWorkingHoursError(values.workingHours, {
    required,
  });

  if (nameError) errors.name = nameError;
  if (addressError) errors.address = addressError;
  if (phoneError) errors.phone = phoneError;
  if (emailError) errors.email = emailError;
  if (workingHoursError) errors.workingHours = workingHoursError;

  return errors;
}

//===================================================================

function clearableDraftValue(
  normalizedValue: string | undefined,
  baselineValue: string | undefined
): string | null | undefined {
  if (normalizedValue !== undefined) return normalizedValue;
  return baselineValue !== undefined ? null : undefined;
}

//===================================================================

export function normalizePharmacyContactForm(
  values: PharmacyContactFormValues,
  mode: PharmacyValidationMode = 'verification',
  baseline?: PharmacyContactFormValues
): PharmacyContactPatch {
  const normalized = {
    name: normalizeOptionalText(values.name),
    address: normalizeOptionalText(values.address),
    phone: normalizeOptionalText(values.phone)
      ? normalizePhoneInput(values.phone)
      : undefined,
    email: normalizeOptionalText(values.email)
      ? normalizeEmail(values.email)
      : undefined,
    workingHours: normalizeOptionalText(values.workingHours),
  };

  if (mode === 'verification') {
    return {
      name: normalized.name ?? '',
      address: normalized.address ?? '',
      phone: normalized.phone ?? '',
      email: normalized.email ?? '',
      workingHours: normalized.workingHours ?? '',
    };
  }

  const baselineNormalized = baseline
    ? {
        address: normalizeOptionalText(baseline.address),
        phone: normalizeOptionalText(baseline.phone)
          ? normalizePhoneInput(baseline.phone)
          : undefined,
        email: normalizeOptionalText(baseline.email)
          ? normalizeEmail(baseline.email)
          : undefined,
        workingHours: normalizeOptionalText(baseline.workingHours),
      }
    : {};

  const result: PharmacyContactPatch = {};
  if (normalized.name !== undefined) result.name = normalized.name;

  const address = clearableDraftValue(normalized.address, baselineNormalized.address);
  const phone = clearableDraftValue(normalized.phone, baselineNormalized.phone);
  const email = clearableDraftValue(normalized.email, baselineNormalized.email);
  const workingHours = clearableDraftValue(
    normalized.workingHours,
    baselineNormalized.workingHours
  );

  if (address !== undefined) result.address = address;
  if (phone !== undefined) result.phone = phone;
  if (email !== undefined) result.email = email;
  if (workingHours !== undefined) result.workingHours = workingHours;

  return result;
}

//===================================================================

export function validatePharmacyAboutForm(
  values: PharmacyAboutFormValues,
  mode: PharmacyValidationMode = 'verification'
): PharmacyAboutFormErrors {
  const errors: PharmacyAboutFormErrors = {};
  const descriptionError = buildTextEditorError(values.description, {
    required: mode === 'verification',
  });

  if (descriptionError) errors.description = descriptionError;
  return errors;
}

//===================================================================

export function normalizePharmacyAboutForm(
  values: PharmacyAboutFormValues,
  mode: PharmacyValidationMode = 'verification',
  baseline?: PharmacyAboutFormValues
): PharmacyAboutPatch {
  const description = normalizeOptionalText(values.description);

  if (mode === 'verification') return { description: description ?? '' };

  const baselineDescription = baseline
    ? normalizeOptionalText(baseline.description)
    : undefined;
  const nextDescription = clearableDraftValue(
    description,
    baselineDescription
  );

  return nextDescription !== undefined ? { description: nextDescription } : {};
}

//===================================================================

export function validatePharmacyPaymentForm(
  values: PharmacyPaymentFormValues,
  mode: PharmacyValidationMode = 'verification'
): PharmacyPaymentFormErrors {
  const errors: PharmacyPaymentFormErrors = {};
  const required = mode === 'verification';

  const recipientNameError = buildBankRecipientNameError(values.recipientName, {
    required,
  });
  const taxIdError = buildTaxIdError(values.taxId, { required });
  const ibanError = buildIbanError(values.iban, { required });
  const bankNameError = buildBankNameError(values.bankName, { required });

  const receiptEmailError =
    values.receiptEmail.trim() || required
      ? buildEmailError(values.receiptEmail)
      : '';

  const paymentPurposeError = buildPaymentPurposeError(values.paymentPurpose, {
    required,
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

export function normalizePharmacyPaymentForm(
  values: PharmacyPaymentFormValues,
  mode: PharmacyValidationMode = 'verification',
  baseline?: PharmacyPaymentFormValues
): PharmacyPaymentPatch {
  const normalized = {
    recipientName: normalizeOptionalText(values.recipientName),
    taxId: normalizeOptionalText(values.taxId),
    iban: normalizeOptionalText(values.iban)
      ? normalizeIban(values.iban)
      : undefined,
    bankName: normalizeOptionalText(values.bankName),
    receiptEmail: normalizeOptionalText(values.receiptEmail)
      ? normalizeEmail(values.receiptEmail)
      : undefined,
    paymentPurpose: normalizeOptionalText(values.paymentPurpose),
  };

  if (mode === 'verification') {
    return {
      recipientName: normalized.recipientName ?? '',
      taxId: normalized.taxId ?? '',
      iban: normalized.iban ?? '',
      bankName: normalized.bankName ?? '',
      receiptEmail: normalized.receiptEmail ?? '',
      paymentPurpose: normalized.paymentPurpose ?? '',
    };
  }

  const baselineNormalized = baseline
    ? {
        recipientName: normalizeOptionalText(baseline.recipientName),
        taxId: normalizeOptionalText(baseline.taxId),
        iban: normalizeOptionalText(baseline.iban)
          ? normalizeIban(baseline.iban)
          : undefined,
        bankName: normalizeOptionalText(baseline.bankName),
        receiptEmail: normalizeOptionalText(baseline.receiptEmail)
          ? normalizeEmail(baseline.receiptEmail)
          : undefined,
        paymentPurpose: normalizeOptionalText(baseline.paymentPurpose),
      }
    : {};

  const result: PharmacyPaymentPatch = {};

  const recipientName = clearableDraftValue(
    normalized.recipientName,
    baselineNormalized.recipientName
  );
  const taxId = clearableDraftValue(normalized.taxId, baselineNormalized.taxId);
  const iban = clearableDraftValue(normalized.iban, baselineNormalized.iban);
  const bankName = clearableDraftValue(
    normalized.bankName,
    baselineNormalized.bankName
  );
  const receiptEmail = clearableDraftValue(
    normalized.receiptEmail,
    baselineNormalized.receiptEmail
  );
  const paymentPurpose = clearableDraftValue(
    normalized.paymentPurpose,
    baselineNormalized.paymentPurpose
  );

  if (recipientName !== undefined) result.recipientName = recipientName;
  if (taxId !== undefined) result.taxId = taxId;
  if (iban !== undefined) result.iban = iban;
  if (bankName !== undefined) result.bankName = bankName;
  if (receiptEmail !== undefined) result.receiptEmail = receiptEmail;
  if (paymentPurpose !== undefined) result.paymentPurpose = paymentPurpose;

  return result;
}

//===================================================================

export {
  PHARMACY_NAME_MAX_LENGTH,
  BANK_RECIPIENT_NAME_MAX_LENGTH,
  BANK_NAME_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
  WORKING_HOURS_MAX_LENGTH,
  TEXT_EDITOR_MAX_LENGTH,
  TAX_ID_MAX_LENGTH,
  IBAN_MAX_LENGTH,
  PAYMENT_PURPOSE_MAX_LENGTH,
};
