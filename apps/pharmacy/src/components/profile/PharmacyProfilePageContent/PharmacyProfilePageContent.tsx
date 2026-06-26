'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { KeyRound, MonitorSmartphone } from 'lucide-react';

import {
  Button,
  Container,
  LoadingSpinner,
  PharmacyAboutFields,
  PictureCard,
  ReviewsList,
  Tabs,
  WorkingHoursInput,
} from '@e-pharmacy/ui/common';

import {
  AddressInput,
  CommentInput,
  EmailInput,
  IbanInput,
  NameInput,
  PasswordInput,
  PhoneInput,
  TaxIdInput,
} from '@e-pharmacy/ui/form-fields';

import { useToast } from '@e-pharmacy/ui/feedback';
import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import { useAuth } from '@e-pharmacy/auth/core';

import { getProfileBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import { PageLoader } from '@/components/pharmacy/PageLoader';

import css from './PharmacyProfilePageContent.module.css';

//===================================================================

type AuthUser = NonNullable<ReturnType<typeof useAuth>['user']>;

type ProfileTab =
  | 'data'
  | 'pharmacy-data'
  | 'about'
  | 'payment'
  | 'reviews'
  | 'sessions';

type TouchedMap<T extends string> = Partial<Record<T, boolean>>;

type OwnerDataValues = {
  name: string;
  phone: string;
};

type PasswordValues = {
  currentPassword: string;
  newPassword: string;
};

type PharmacyDataValues = {
  address: string;
  phone: string;
  email: string;
  workingHours: string;
};

type AboutValues = {
  description: string;
};

type PaymentValues = {
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  receiptEmail: string;
  paymentPurpose: string;
};

//===================================================================

const USER_NAME_MAX_LENGTH = 50;
const PHONE_MAX_LENGTH = 13;
const EMAIL_MAX_LENGTH = 64;
const PASSWORD_MAX_LENGTH = 20;
const ADDRESS_MAX_LENGTH = 200;
const WORKING_HOURS_MAX_LENGTH = 160;
const PAYMENT_PURPOSE_MAX_LENGTH = 500;

const INITIAL_VISIBLE_REVIEWS_COUNT = 10;

//===================================================================

const TABS: Array<{ value: ProfileTab; label: string }> = [
  { value: 'data', label: 'My data' },
  { value: 'pharmacy-data', label: 'Pharmacy data' },
  { value: 'about', label: 'About pharmacy' },
  { value: 'payment', label: 'Payment details' },
  { value: 'reviews', label: 'Reviews (13)' },
  { value: 'sessions', label: 'Active sessions' },
];

const DEMO_REVIEWS = [
  {
    id: 'review-1',
    userName: 'Dmytro',
    rating: 4,
    createdAt: '2026-04-07T12:00:00.000Z',
    comment:
      'Very good experience from search to pickup. The catalog helped me compare similar products, the rating looked realistic, and the pharmacy page showed useful address and phone details. The item was available exactly as shown, which is important when someone needs products quickly.',
  },
  {
    id: 'review-2',
    userName: 'Sofia',
    rating: 5,
    createdAt: '2026-04-06T12:00:00.000Z',
    comment:
      'I was checking several options and this one looked the most convenient because the description, price, rating, and pharmacy information were easy to understand. The product was prepared on time, and the checkout flow felt simple.',
  },
  {
    id: 'review-3',
    userName: 'Maksym',
    rating: 4,
    createdAt: '2026-04-05T12:00:00.000Z',
    comment:
      'The order was processed quickly, the product page had clear details, and the pharmacy staff explained the pickup process very politely. I liked that the information about availability matched the real stock.',
  },
  {
    id: 'review-4',
    userName: 'Andrii',
    rating: 5,
    createdAt: '2026-04-04T12:00:00.000Z',
    comment:
      'The product name, package size and price were clear, and the pharmacy had enough stock when I came to collect the order. Detailed feedback helps compare pharmacies before making a purchase.',
  },
  ...Array.from({ length: 9 }, (_, index) => ({
    id: `review-extra-${index + 1}`,
    userName: ['Olena', 'Iryna', 'Nazar', 'Kateryna', 'Roman', 'Vira', 'Taras', 'Oksana', 'Yurii'][index],
    rating: index % 3 === 0 ? 5 : 4,
    createdAt: `2026-03-${String(26 - index).padStart(2, '0')}T12:00:00.000Z`,
    comment:
      'The pharmacy profile was clear, pickup details were easy to find, and the order status changed on time. This review is demo content for the pharmacy cabinet UI.',
  })),
];

const DEMO_SESSIONS = [
  {
    id: 'current-session',
    deviceName: 'Chrome on Windows',
    lastUsedAt: 'Now',
    isCurrent: true,
  },
  {
    id: 'tablet-session',
    deviceName: 'Tablet browser',
    lastUsedAt: 'Today, 09:40',
    isCurrent: false,
  },
];

//===================================================================

function isRequired(value: string) {
  return value.trim().length > 0;
}

function sanitizePhone(value: string) {
  return value.replace(/[^(+\d)]/g, '').slice(0, PHONE_MAX_LENGTH);
}

function sanitizeTaxId(value: string) {
  return value.replace(/\D/g, '').slice(0, 10);
}

function sanitizeIban(value: string) {
  return value.replace(/\s/g, '').toUpperCase().slice(0, 29);
}

function validateEmail(value: string) {
  if (!isRequired(value)) return 'Email is required.';
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter a valid email.';
  return '';
}

function validatePhone(value: string) {
  if (!isRequired(value)) return 'Phone is required.';
  if (!/^\+380\d{9}$/.test(value)) return 'Use format +380XXXXXXXXX.';
  return '';
}

function validateTaxId(value: string) {
  if (!isRequired(value)) return 'Tax ID / EDRPOU is required.';
  if (!/^\d{8,10}$/.test(value)) return 'Use 8–10 digits.';
  return '';
}

function validateIban(value: string) {
  if (!isRequired(value)) return 'IBAN is required.';
  if (!/^UA\d{27}$/.test(value)) return 'Use UA + 27 digits.';
  return '';
}

function isDirty<T extends Record<string, string>>(values: T, initialValues: T) {
  return Object.keys(values).some(
    (key) => values[key as keyof T] !== initialValues[key as keyof T]
  );
}

function hasErrors(errors: Record<string, string>) {
  return Object.values(errors).some(Boolean);
}

function markTouched<T extends string>(fields: T[]): TouchedMap<T> {
  return fields.reduce<TouchedMap<T>>((acc, field) => {
    acc[field] = true;
    return acc;
  }, {});
}

function formatCapitalized(value: string) {
  return value ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value;
}

//===================================================================

function PharmacyProfilePageContent() {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady || !user) {
    return <PageLoader label="Loading pharmacy profile..." />;
  }

  return <PharmacyProfilePage user={user} />;
}

type PharmacyProfilePageProps = Readonly<{
  user: AuthUser;
}>;

function PharmacyProfilePage({ user }: PharmacyProfilePageProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>('data');
  const [isPictureSaving, setIsPictureSaving] = useState(false);
  const [pictureUrl, setPictureUrl] = useState<string | null>(
    user?.pictureUrl ?? null
  );
  const [pharmacyPictureUrl, setPharmacyPictureUrl] = useState<string | null>(
    null
  );
  const [isPharmacyPictureSaving, setIsPharmacyPictureSaving] = useState(false);
  const [isOwnerSaving, setIsOwnerSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isPharmacySaving, setIsPharmacySaving] = useState(false);
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  const initialOwnerValues = useMemo<OwnerDataValues>(
    () => ({
      name: user?.name ?? '',
      phone: user?.phone ?? '',
    }),
    [user?.name, user?.phone]
  );

  const [ownerValues, setOwnerValues] = useState<OwnerDataValues>({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
  });

  const [ownerTouched, setOwnerTouched] = useState<TouchedMap<keyof OwnerDataValues>>({});

  const [passwordValues, setPasswordValues] = useState<PasswordValues>({
    currentPassword: '',
    newPassword: '',
  });

  const [passwordTouched, setPasswordTouched] = useState<TouchedMap<keyof PasswordValues>>({});

  const [pharmacyValues, setPharmacyValues] = useState<PharmacyDataValues>({
    address: '12 Central Street, Kyiv',
    phone: user?.phone ?? '+380501112233',
    email: user?.email ?? 'green.cross@example.com',
    workingHours: 'Mon–Fri: 08:00–20:00, Sat–Sun: 09:00–18:00',
  });

  const [initialPharmacyValues, setInitialPharmacyValues] = useState<PharmacyDataValues>(pharmacyValues);
  const [pharmacyTouched, setPharmacyTouched] = useState<TouchedMap<keyof PharmacyDataValues>>({});

  const [aboutValues, setAboutValues] = useState<AboutValues>({
    description:
      'Green Cross Pharmacy helps clients quickly reserve products, compare availability, and pick up orders safely.',
  });

  const [initialAboutValues, setInitialAboutValues] = useState<AboutValues>(aboutValues);
  const [aboutTouched, setAboutTouched] = useState<TouchedMap<keyof AboutValues>>({});

  const [paymentValues, setPaymentValues] = useState<PaymentValues>({
    recipientName: 'Green Cross Pharmacy LLC',
    taxId: '12345678',
    iban: 'UA123456789012345678901234567',
    bankName: 'E-PHARMACY Bank',
    receiptEmail: user?.email ?? 'green.cross@example.com',
    paymentPurpose: 'Payment for reserved pharmacy products.',
  });

  const [initialPaymentValues, setInitialPaymentValues] = useState<PaymentValues>(paymentValues);
  const [paymentTouched, setPaymentTouched] = useState<TouchedMap<keyof PaymentValues>>({});


  const status = isVerificationSent ? 'on verification' : 'new';
  const isModerationLocked = status === 'on verification';

  const ownerErrors = {
    name: isRequired(ownerValues.name) ? '' : 'Name is required.',
    phone: validatePhone(ownerValues.phone),
  };

  const passwordErrors = {
    currentPassword: isRequired(passwordValues.currentPassword)
      ? ''
      : 'Current password is required.',
    newPassword:
      passwordValues.newPassword.length >= 6
        ? ''
        : 'Password must contain at least 6 characters.',
  };

  const pharmacyErrors = {
    address: isRequired(pharmacyValues.address) ? '' : 'Address is required.',
    phone: validatePhone(pharmacyValues.phone),
    email: validateEmail(pharmacyValues.email),
    workingHours: isRequired(pharmacyValues.workingHours)
      ? ''
      : 'Working hours are required.',
  };

  const aboutErrors = {
    description: isRequired(aboutValues.description)
      ? ''
      : 'Pharmacy description is required.',
  };

  const paymentErrors = {
    recipientName: isRequired(paymentValues.recipientName)
      ? ''
      : 'Recipient name is required.',
    taxId: validateTaxId(paymentValues.taxId),
    iban: validateIban(paymentValues.iban),
    bankName: isRequired(paymentValues.bankName) ? '' : 'Bank name is required.',
    receiptEmail: validateEmail(paymentValues.receiptEmail),
    paymentPurpose: isRequired(paymentValues.paymentPurpose)
      ? ''
      : 'Payment purpose is required.',
  };

  const canSendForVerification =
    !hasErrors(pharmacyErrors) &&
    !hasErrors(aboutErrors) &&
    !hasErrors(paymentErrors) &&
    !isModerationLocked;

  const ownerFormIsDirty = isDirty(ownerValues, initialOwnerValues);
  const pharmacyFormIsDirty = isDirty(pharmacyValues, initialPharmacyValues);
  const aboutFormIsDirty = isDirty(aboutValues, initialAboutValues);
  const paymentFormIsDirty = isDirty(paymentValues, initialPaymentValues);

  const tabs = useMemo(
    () => TABS.map((tab) => (tab.value === 'reviews' ? { ...tab, label: `Reviews (${DEMO_REVIEWS.length})` } : tab)),
    []
  );

  const handleOwnerChange = (field: keyof OwnerDataValues, value: string) => {
    setOwnerTouched((current) => ({ ...current, [field]: true }));
    setOwnerValues((current) => ({ ...current, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordValues, value: string) => {
    setPasswordTouched((current) => ({ ...current, [field]: true }));
    setPasswordValues((current) => ({ ...current, [field]: value }));
  };

  const handlePharmacyChange = (field: keyof PharmacyDataValues, value: string) => {
    setPharmacyTouched((current) => ({ ...current, [field]: true }));
    setPharmacyValues((current) => ({ ...current, [field]: value }));
  };

  const handleAboutChange = (value: string) => {
    setAboutTouched({ description: true });
    setAboutValues({ description: value });
  };

  const handlePaymentChange = (field: keyof PaymentValues, value: string) => {
    setPaymentTouched((current) => ({ ...current, [field]: true }));
    setPaymentValues((current) => ({ ...current, [field]: value }));
  };

  const handleOwnerSubmit = () => {
    setOwnerTouched(markTouched(['name', 'phone']));

    if (hasErrors(ownerErrors) || !ownerFormIsDirty) return;

    setIsOwnerSaving(true);
    window.setTimeout(() => {
      setIsOwnerSaving(false);
      toast.success('Owner data saved successfully.');
    }, 350);
  };

  const handlePasswordSubmit = () => {
    setPasswordTouched(markTouched(['currentPassword', 'newPassword']));

    if (hasErrors(passwordErrors)) return;

    setIsPasswordSaving(true);
    window.setTimeout(() => {
      setIsPasswordSaving(false);
      setPasswordValues({ currentPassword: '', newPassword: '' });
      setPasswordTouched({});
      toast.success('Password changed successfully.');
    }, 350);
  };

  const handlePharmacySubmit = () => {
    setPharmacyTouched(markTouched(['address', 'phone', 'email', 'workingHours']));

    if (hasErrors(pharmacyErrors) || !pharmacyFormIsDirty || isModerationLocked) return;

    setIsPharmacySaving(true);
    window.setTimeout(() => {
      setInitialPharmacyValues(pharmacyValues);
      setIsPharmacySaving(false);
      toast.success('Pharmacy data saved successfully.');
    }, 350);
  };

  const handleAboutSubmit = () => {
    setAboutTouched(markTouched(['description']));

    if (hasErrors(aboutErrors) || !aboutFormIsDirty || isModerationLocked) return;

    setIsPharmacySaving(true);
    window.setTimeout(() => {
      setInitialAboutValues(aboutValues);
      setIsPharmacySaving(false);
      toast.success('About pharmacy saved successfully.');
    }, 350);
  };

  const handlePaymentSubmit = () => {
    setPaymentTouched(
      markTouched([
        'recipientName',
        'taxId',
        'iban',
        'bankName',
        'receiptEmail',
        'paymentPurpose',
      ])
    );

    if (hasErrors(paymentErrors) || !paymentFormIsDirty || isModerationLocked) return;

    setIsPharmacySaving(true);
    window.setTimeout(() => {
      setInitialPaymentValues(paymentValues);
      setIsPharmacySaving(false);
      toast.success('Payment details saved successfully.');
    }, 350);
  };

  const handleSendForVerification = () => {
    setPharmacyTouched(markTouched(['address', 'phone', 'email', 'workingHours']));
    setAboutTouched(markTouched(['description']));
    setPaymentTouched(
      markTouched([
        'recipientName',
        'taxId',
        'iban',
        'bankName',
        'receiptEmail',
        'paymentPurpose',
      ])
    );

    if (!canSendForVerification) return;

    setIsVerificationSent(true);
    toast.success('Pharmacy profile was sent for verification.');
  };

  const handleProfilePictureChange = async (nextPictureUrl: string | null) => {
    setIsPictureSaving(true);
    window.setTimeout(() => {
      setPictureUrl(nextPictureUrl);
      setIsPictureSaving(false);
      toast.success(nextPictureUrl ? 'Profile photo was updated.' : 'Profile photo was removed.');
    }, 300);
  };

  const handlePharmacyPictureChange = async (nextPictureUrl: string | null) => {
    setIsPharmacyPictureSaving(true);
    window.setTimeout(() => {
      setPharmacyPictureUrl(nextPictureUrl);
      setIsPharmacyPictureSaving(false);
      toast.success(nextPictureUrl ? 'Pharmacy photo was updated.' : 'Pharmacy photo was removed.');
    }, 300);
  };

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="pharmacy-profile-title">
        <Container>
          <Breadcrumbs items={getProfileBreadcrumbs()} />

          <h1 className={css.title} id="pharmacy-profile-title">
            Pharmacy profile
          </h1>

          <p className={css.text}>
            Manage your pharmacy profile, contact details, payment details, and reviews.
          </p>

          <div className={css.profileShell}>
            <aside className={css.sidebar} aria-label="Pharmacy profile summary">
              <PictureCard
                name={user.name}
                pictureUrl={pictureUrl}
                isSaving={isPictureSaving}
                onChange={handleProfilePictureChange}
                onError={toast.error}
              />

              <div className={css.nameBlock}>
                <h2 className={css.name}>{user.name}</h2>
                <p className={css.email}>{user.email}</p>
              </div>

              <dl className={css.compactDetails}>
                <div>
                  <dt>Role</dt>
                  <dd>{formatCapitalized(user.role)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{formatCapitalized(status)}</dd>
                </div>
              </dl>

              <div className={css.statusNote}>
                <h3>{isVerificationSent ? 'Verification requested' : 'Verification required'}</h3>
                <p>
                  {isVerificationSent
                    ? 'Your pharmacy data is waiting for Admin review.'
                    : 'Complete all required pharmacy data, about pharmacy, and payment details to send the pharmacy for verification.'}
                </p>
              </div>

              <Button
                type="button"
                fullWidth
                disabled={!canSendForVerification}
                onClick={handleSendForVerification}
              >
                {isVerificationSent ? 'Waiting for verification' : 'Send for verification'}
              </Button>
            </aside>

            <div className={css.contentCard}>
              <Tabs
                items={tabs}
                activeValue={activeTab}
                ariaLabel="Pharmacy profile sections"
                mobileVisibleCount={2}
                tabletVisibleCount={4}
                onChange={setActiveTab}
              />

              {activeTab === 'data' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section className={css.panelSection} aria-labelledby="owner-data-title">
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="owner-data-title">
                        Personal data
                      </h2>
                      <p className={css.panelText}>
                        These are owner account details. They are not moderated.
                      </p>
                    </div>

                    <div className={css.formGrid}>
                      <NameInput
                        id="owner-name"
                        name="ownerName"
                        value={ownerValues.name}
                        error={ownerErrors.name}
                        isTouched={ownerTouched.name}
                        maxLength={USER_NAME_MAX_LENGTH}
                        onChange={(event) => handleOwnerChange('name', event.target.value)}
                      />

                      <PhoneInput
                        id="owner-phone"
                        name="ownerPhone"
                        value={ownerValues.phone}
                        error={ownerErrors.phone}
                        isTouched={ownerTouched.phone}
                        maxLength={PHONE_MAX_LENGTH}
                        onChange={(event) => handleOwnerChange('phone', sanitizePhone(event.target.value))}
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={hasErrors(ownerErrors) || !ownerFormIsDirty || isOwnerSaving}
                      isLoading={isOwnerSaving}
                      loadingLabel="Saving..."
                      onClick={handleOwnerSubmit}
                    >
                      Save changes
                    </Button>
                  </section>

                  <section className={css.panelSection} aria-labelledby="password-title">
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="password-title">
                        Change password
                      </h2>
                      <p className={css.panelText}>Keep your account more securely locked.</p>
                    </div>

                    <div className={css.formGrid}>
                      <PasswordInput
                        id="current-password"
                        name="currentPassword"
                        label="Current password"
                        value={passwordValues.currentPassword}
                        autoComplete="current-password"
                        error={passwordErrors.currentPassword}
                        isTouched={passwordTouched.currentPassword}
                        isVisible={isCurrentPasswordVisible}
                        maxLength={PASSWORD_MAX_LENGTH}
                        onChange={(event) => handlePasswordChange('currentPassword', event.target.value)}
                        onToggleVisibility={() => setIsCurrentPasswordVisible((value) => !value)}
                      />

                      <PasswordInput
                        id="new-password"
                        name="newPassword"
                        label="New password"
                        value={passwordValues.newPassword}
                        autoComplete="new-password"
                        error={passwordErrors.newPassword}
                        isTouched={passwordTouched.newPassword}
                        isVisible={isNewPasswordVisible}
                        maxLength={PASSWORD_MAX_LENGTH}
                        onChange={(event) => handlePasswordChange('newPassword', event.target.value)}
                        onToggleVisibility={() => setIsNewPasswordVisible((value) => !value)}
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={hasErrors(passwordErrors) || isPasswordSaving}
                      iconLeft={<KeyRound size={18} aria-hidden="true" />}
                      isLoading={isPasswordSaving}
                      loadingLabel="Changing..."
                      onClick={handlePasswordSubmit}
                    >
                      Change password
                    </Button>
                  </section>
                </div>
              ) : null}

              {activeTab === 'pharmacy-data' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section className={css.panelSection} aria-labelledby="pharmacy-data-title">
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="pharmacy-data-title">
                        Pharmacy data
                      </h2>
                      <p className={css.panelText}>
                        Public contact details clients will see after verification.
                      </p>
                    </div>

                    <PictureCard
                      name="Green Cross Pharmacy"
                      pictureUrl={pharmacyPictureUrl}
                      isSaving={isPharmacyPictureSaving}
                      labels={{
                        uploadAriaLabel: 'Upload pharmacy photo',
                        hint: 'Upload a lightweight JPG, PNG, or WEBP image up to 450 KB. The photo is saved right away.',
                        uploadButton: 'Upload pharmacy photo',
                        removeButton: 'Remove pharmacy photo',
                      }}
                      onChange={handlePharmacyPictureChange}
                      onError={toast.error}
                    />

                    <div className={css.formGrid}>
                      <AddressInput
                        id="pharmacy-address"
                        name="pharmacyAddress"
                        label="Address"
                        placeholder="12 Central Street, Kyiv"
                        className={css.fieldWide}
                        value={pharmacyValues.address}
                        error={pharmacyErrors.address}
                        isTouched={pharmacyTouched.address}
                        maxLength={ADDRESS_MAX_LENGTH}
                        disabled={isModerationLocked}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                          handlePharmacyChange('address', event.target.value)
                        }
                      />

                      <PhoneInput
                        id="pharmacy-phone"
                        name="pharmacyPhone"
                        value={pharmacyValues.phone}
                        error={pharmacyErrors.phone}
                        isTouched={pharmacyTouched.phone}
                        maxLength={PHONE_MAX_LENGTH}
                        disabled={isModerationLocked}
                        onChange={(event) => handlePharmacyChange('phone', sanitizePhone(event.target.value))}
                      />

                      <EmailInput
                        id="pharmacy-email"
                        name="pharmacyEmail"
                        value={pharmacyValues.email}
                        error={pharmacyErrors.email}
                        isTouched={pharmacyTouched.email}
                        maxLength={EMAIL_MAX_LENGTH}
                        disabled={isModerationLocked}
                        onChange={(event) => handlePharmacyChange('email', event.target.value)}
                      />

                      <WorkingHoursInput
                        id="pharmacy-working-hours"
                        name="workingHours"
                        value={pharmacyValues.workingHours}
                        error={pharmacyErrors.workingHours}
                        isTouched={pharmacyTouched.workingHours}
                        maxLength={WORKING_HOURS_MAX_LENGTH}
                        disabled={isModerationLocked}
                        onChange={(event) => handlePharmacyChange('workingHours', event.target.value)}
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={hasErrors(pharmacyErrors) || !pharmacyFormIsDirty || isPharmacySaving || isModerationLocked}
                      isLoading={isPharmacySaving}
                      loadingLabel="Saving..."
                      onClick={handlePharmacySubmit}
                    >
                      Save pharmacy data
                    </Button>
                  </section>
                </div>
              ) : null}

              {activeTab === 'about' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section className={css.panelSection} aria-labelledby="about-title">
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="about-title">
                        About pharmacy
                      </h2>
                      <p className={css.panelText}>
                        Add the public pharmacy description clients will read before ordering.
                      </p>
                    </div>

                    <PharmacyAboutFields
                      description={aboutValues.description}
                      descriptionError={aboutErrors.description}
                      isDescriptionTouched={aboutTouched.description}
                      disabled={isModerationLocked}
                      onDescriptionChange={handleAboutChange}
                    />

                    <Button
                      type="button"
                      disabled={hasErrors(aboutErrors) || !aboutFormIsDirty || isPharmacySaving || isModerationLocked}
                      isLoading={isPharmacySaving}
                      loadingLabel="Saving..."
                      onClick={handleAboutSubmit}
                    >
                      Save about pharmacy
                    </Button>
                  </section>
                </div>
              ) : null}

              {activeTab === 'payment' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section className={css.panelSection} aria-labelledby="payment-title">
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="payment-title">
                        Payment details
                      </h2>
                      <p className={css.panelText}>
                        These payment details are required before verification.
                      </p>
                    </div>

                    <div className={css.formGrid}>
                      <NameInput
                        id="recipient-name"
                        name="recipientName"
                        label="Recipient name"
                        value={paymentValues.recipientName}
                        error={paymentErrors.recipientName}
                        isTouched={paymentTouched.recipientName}
                        disabled={isModerationLocked}
                        maxLength={USER_NAME_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('recipientName', event.target.value)}
                      />

                      <TaxIdInput
                        id="tax-id"
                        name="taxId"
                        value={paymentValues.taxId}
                        error={paymentErrors.taxId}
                        isTouched={paymentTouched.taxId}
                        disabled={isModerationLocked}
                        onChange={(event) => handlePaymentChange('taxId', sanitizeTaxId(event.target.value))}
                      />

                      <IbanInput
                        id="iban"
                        name="iban"
                        className={css.fieldWide}
                        value={paymentValues.iban}
                        error={paymentErrors.iban}
                        isTouched={paymentTouched.iban}
                        disabled={isModerationLocked}
                        onChange={(event) => handlePaymentChange('iban', sanitizeIban(event.target.value))}
                      />

                      <NameInput
                        id="bank-name"
                        name="bankName"
                        label="Bank name"
                        value={paymentValues.bankName}
                        error={paymentErrors.bankName}
                        isTouched={paymentTouched.bankName}
                        disabled={isModerationLocked}
                        maxLength={USER_NAME_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('bankName', event.target.value)}
                      />

                      <EmailInput
                        id="receipt-email"
                        name="receiptEmail"
                        label="Receipt email"
                        value={paymentValues.receiptEmail}
                        error={paymentErrors.receiptEmail}
                        isTouched={paymentTouched.receiptEmail}
                        disabled={isModerationLocked}
                        maxLength={EMAIL_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('receiptEmail', event.target.value)}
                      />

                      <CommentInput
                        id="payment-purpose"
                        name="paymentPurpose"
                        label="Payment purpose"
                        className={css.fieldWide}
                        value={paymentValues.paymentPurpose}
                        error={paymentErrors.paymentPurpose}
                        isTouched={paymentTouched.paymentPurpose}
                        required
                        disabled={isModerationLocked}
                        maxLength={PAYMENT_PURPOSE_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('paymentPurpose', event.target.value)}
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={hasErrors(paymentErrors) || !paymentFormIsDirty || isPharmacySaving || isModerationLocked}
                      isLoading={isPharmacySaving}
                      loadingLabel="Saving..."
                      onClick={handlePaymentSubmit}
                    >
                      Save payment details
                    </Button>
                  </section>
                </div>
              ) : null}

              {activeTab === 'reviews' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <ReviewsList
                    reviews={DEMO_REVIEWS}
                    initialVisibleCount={INITIAL_VISIBLE_REVIEWS_COUNT}
                    emptyTitle="This pharmacy has no reviews yet."
                  />
                </div>
              ) : null}

              {activeTab === 'sessions' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section className={css.panelSection} aria-labelledby="sessions-title">
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="sessions-title">
                        Active sessions and devices
                      </h2>
                      <p className={css.panelText}>
                        Review devices signed in to your pharmacy account.
                      </p>
                    </div>

                    {!DEMO_SESSIONS.length ? (
                      <LoadingSpinner label="Loading active sessions..." />
                    ) : (
                      <ul className={css.sessionsList}>
                        {DEMO_SESSIONS.map((session) => (
                          <li className={css.sessionCard} key={session.id}>
                            <MonitorSmartphone size={22} aria-hidden="true" />
                            <div className={css.sessionInfo}>
                              <strong>{session.deviceName}</strong>
                              <span>Last used: {session.lastUsedAt}</span>
                            </div>
                            {session.isCurrent ? (
                              <span className={css.currentSession}>Current session</span>
                            ) : (
                              <Button type="button" variant="secondary" size="sm">
                                Revoke
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default PharmacyProfilePageContent;
export { PharmacyProfilePageContent };
