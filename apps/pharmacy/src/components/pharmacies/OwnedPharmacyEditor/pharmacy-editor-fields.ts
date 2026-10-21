import type {
  MyPharmacyProfile,
  PharmacyProfileUpdateChanges,
} from '@e-pharmacy/types/pharmacies';

import {
  validatePharmacyContactForm,
  validatePharmacyAboutForm,
  validatePharmacyPaymentForm,
  normalizeEmail,
  normalizeIban,
  type PharmacyValidationMode,
} from '@e-pharmacy/validation/pharmacy';

import { buildPictureUrlError } from '@e-pharmacy/validation/files';

//===================================================================

// The existing profile DTO and update contract are the canonical form model;
// no second persistence representation is introduced for new pharmacies.
export type PharmacyEditorField =
  | 'name'
  | 'address'
  | 'settlement'
  | 'region'
  | 'phone'
  | 'email'
  | 'workingHours'
  | 'imageUrl'
  | 'description'
  | 'shortDescription'
  | 'recipientName'
  | 'taxId'
  | 'iban'
  | 'bankName'
  | 'receiptEmail'
  | 'paymentPurpose';

//===================================================================

export const EMPTY_FIELDS: Record<PharmacyEditorField, string> = {
  name: '',
  address: '',
  settlement: '',
  region: '',
  phone: '',
  email: '',
  workingHours: '',
  imageUrl: '',
  description: '',
  shortDescription: '',
  recipientName: '',
  taxId: '',
  iban: '',
  bankName: '',
  receiptEmail: '',
  paymentPurpose: '',
};

//===================================================================

export type PharmacyEditorValues = Record<PharmacyEditorField, string>;

//===================================================================

// A newly created pharmacy must have a meaningful name before its first save.
export const NEW_PHARMACY_NAME_MIN_LENGTH = 10;

//===================================================================

export type PharmacyEditorTab = 'data' | 'about' | 'payment' | 'documents';

//===================================================================

export const EDITOR_TABS: readonly { id: PharmacyEditorTab; label: string }[] =
  [
    { id: 'data', label: 'Pharmacy data' },
    { id: 'about', label: 'About pharmacy' },
    { id: 'payment', label: 'Payment details' },
    { id: 'documents', label: 'Pharmacy documents' },
  ];

//===================================================================

export const REQUIRED_FIELDS: Record<
  Exclude<PharmacyEditorTab, 'documents'>,
  readonly PharmacyEditorField[]
> = {
  data: [
    'name',
    'shortDescription',
    'address',
    'settlement',
    'region',
    'phone',
    'email',
    'workingHours',
    'imageUrl',
  ],

  about: ['description'],

  payment: [
    'recipientName',
    'taxId',
    'iban',
    'bankName',
    'receiptEmail',
    'paymentPurpose',
  ],
};

//===================================================================

export function valuesFromPharmacy(
  pharmacy: MyPharmacyProfile
): PharmacyEditorValues {
  return {
    name: pharmacy.name ?? '',

    address: pharmacy.location?.address ?? '',
    settlement: pharmacy.location?.settlement ?? '',
    region: pharmacy.location?.region ?? '',

    phone: pharmacy.phone ?? '',
    email: pharmacy.email ?? '',

    workingHours: pharmacy.workingHours ?? '',

    imageUrl: pharmacy.imageUrl ?? '',
    description: pharmacy.description ?? '',
    shortDescription: pharmacy.shortDescription ?? '',

    recipientName: pharmacy.bankDetails?.recipientName ?? '',
    taxId: pharmacy.bankDetails?.taxId ?? '',
    iban: pharmacy.bankDetails?.iban ?? '',
    bankName: pharmacy.bankDetails?.bankName ?? '',
    receiptEmail: pharmacy.bankDetails?.receiptEmail ?? '',
    paymentPurpose: pharmacy.bankDetails?.paymentPurpose ?? '',
  };
}

//===================================================================

export function buildPharmacyEditorPayload(
  current: PharmacyEditorValues,
  saved?: PharmacyEditorValues
): PharmacyProfileUpdateChanges {
  const field = (name: PharmacyEditorField): string | null | undefined => {
    const raw = current[name].trim();

    const value =
      name === 'email' || name === 'receiptEmail'
        ? normalizeEmail(raw)
        : name === 'iban'
          ? normalizeIban(raw)
          : raw;

    if (saved && value === saved[name]) return undefined;

    return value || (saved ? null : undefined);
  };

  const name = field('name');
  const imageUrl = field('imageUrl');
  const workingHours = field('workingHours');

  const location = {
    address: field('address'),
    settlement: field('settlement'),
    region: field('region'),
  };

  const bankDetails = {
    recipientName: field('recipientName'),
    taxId: field('taxId'),
    iban: field('iban'),
    bankName: field('bankName'),
    receiptEmail: field('receiptEmail'),
    paymentPurpose: field('paymentPurpose'),
  };

  return {
    ...(name !== undefined && name !== null ? { name } : {}),

    ...(Object.values(location).some((v) => v !== undefined)
      ? { location }
      : {}),

    ...(field('phone') !== undefined ? { phone: field('phone') } : {}),
    ...(field('email') !== undefined ? { email: field('email') } : {}),
    ...(workingHours !== undefined ? { workingHours } : {}),
    ...(imageUrl !== undefined ? { imageUrl } : {}),

    ...(field('description') !== undefined
      ? { description: field('description') }
      : {}),

    ...(field('shortDescription') !== undefined
      ? { shortDescription: field('shortDescription') }
      : {}),

    ...(Object.values(bankDetails).some((v) => v !== undefined)
      ? { bankDetails }
      : {}),
  };
}

//===================================================================

// Completeness (verification) is separate from draft validation.
export function validatePharmacyEditor(
  values: PharmacyEditorValues,
  documentCount: number,
  mode: PharmacyValidationMode = 'verification',
  isNewPharmacy = false
): Partial<
  Record<PharmacyEditorField | 'documents' | 'ownerDocuments', string>
> {
  // Reuse the existing pharmacy/profile domain validators in both workflows.
  // Draft mode checks *provided* values; verification requires full completion.
  const contact = validatePharmacyContactForm(values, mode);
  const about = validatePharmacyAboutForm(values, mode);
  const payment = validatePharmacyPaymentForm(values, mode);

  const errors: Partial<
    Record<PharmacyEditorField | 'documents' | 'ownerDocuments', string>
  > = {
    ...contact,
    ...about,
    ...payment,
  };

  // Names are mandatory for all drafts; the stricter minimum applies only
  // when creating a new pharmacy, not when editing older draft records.
  const name = values.name.trim();

  if (!name) {
    errors.name = 'Pharmacy name is required';
  } else if (isNewPharmacy && name.length < NEW_PHARMACY_NAME_MIN_LENGTH) {
    errors.name = `Pharmacy name must be at least ${NEW_PHARMACY_NAME_MIN_LENGTH} characters`;
  }

  const imageError = buildPictureUrlError(values.imageUrl, {
    required: mode === 'verification',
  });

  if (imageError) errors.imageUrl = imageError;

  if (mode === 'verification' && !documentCount) {
    errors.documents = 'Upload at least one pharmacy document';
  }

  return errors;
}

//===================================================================

export function tabHasErrors(
  tab: PharmacyEditorTab,

  errors: Partial<
    Record<PharmacyEditorField | 'documents' | 'ownerDocuments', string>
  >
): boolean {
  if (tab === 'documents')
    return Boolean(errors.documents || errors.ownerDocuments);

  return REQUIRED_FIELDS[tab].some((field) => Boolean(errors[field]));
}
