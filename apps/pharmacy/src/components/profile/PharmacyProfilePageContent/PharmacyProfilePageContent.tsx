'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { KeyRound, MonitorSmartphone } from 'lucide-react';

import {
  Button,
  Container,
  LoadingSpinner,
  PictureCard,
  ReviewsList,
  Tabs,
  TextEditor,
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
import { PageLoader } from '@e-pharmacy/ui/status-pages';
import { useAuth } from '@e-pharmacy/auth/core';
import { formatCapitalizedLabel } from '@e-pharmacy/utils/formatters';

import {
  CHANGE_PASSWORD_FORM_FIELDS,
  CHANGE_PASSWORD_INITIAL_VALUES,
  DATA_PROFILE_FORM_FIELDS,
  PICTURE_ACCEPT,
  PHARMACY_ABOUT_FORM_FIELDS,
  PHARMACY_PAYMENT_FORM_FIELDS,
  PHARMACY_CONTACT_FORM_FIELDS,
  PAYMENT_PURPOSE_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  WORKING_HOURS_MAX_LENGTH,
  TEXT_EDITOR_MAX_LENGTH,
  TAX_ID_MAX_LENGTH,
  IBAN_MAX_LENGTH,
  buildPictureFileError,
  buildPictureUrlError,
  hasValidationErrors,
  isChangePasswordFormDirty,
  isChangePasswordFormValid,
  isDataProfileFormDirty,
  isDataProfileFormValid,
  isPharmacyAboutFormDirty,
  isPharmacyContactFormDirty,
  isPharmacyPaymentFormDirty,
  markAllFieldsTouched,
  sanitizeAddress,
  sanitizeEmail,
  sanitizeIban,
  sanitizeName,
  sanitizePassword,
  sanitizePaymentPurpose,
  sanitizePhone,
  sanitizeTaxId,
  sanitizeTextEditor,
  sanitizeWorkingHours,
  validateChangePasswordForm,
  validateDataProfileForm,
  validatePharmacyAboutForm,
  validatePharmacyContactForm,
  validatePharmacyPaymentForm,
  type ChangePasswordFormValues,
  type ChangePasswordTouchedFields,
  type DataProfileFormValues,
  type DataProfileTouchedFields,
  type PharmacyAboutFormValues,
  type PharmacyAboutTouchedFields,
  type PharmacyContactFormValues,
  type PharmacyContactTouchedFields,
  type PharmacyPaymentFormValues,
  type PharmacyPaymentTouchedFields,
} from '@e-pharmacy/validation';

import { getProfileBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

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

type PharmacyStatus = 'new' | 'on_moderation' | 'active';

//===================================================================

const INITIAL_VISIBLE_REVIEWS_COUNT = 10;

const TABS: Array<{ value: ProfileTab; label: string }> = [
  { value: 'data', label: 'My data' },
  { value: 'pharmacy-data', label: 'Pharmacy data' },
  { value: 'about', label: 'About pharmacy' },
  { value: 'payment', label: 'Payment details' },
  { value: 'reviews', label: 'Reviews' },
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
      'The order was prepared on time, the staff answered questions calmly, and the checkout flow felt simple. Long reviews are useful for testing that the layout remains readable.',
  },
  {
    id: 'review-3',
    userName: 'Maksym',
    rating: 4,
    createdAt: '2026-04-05T12:00:00.000Z',
    comment:
      'The product page had clear details, pickup was explained politely, and availability matched the real stock when I arrived.',
  },
  {
    id: 'review-4',
    userName: 'Andrii',
    rating: 5,
    createdAt: '2026-04-04T12:00:00.000Z',
    comment:
      'The product name, package size, price, and pharmacy contacts were easy to find. It helps compare offers before making a purchase.',
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

function createOwnerInitialValues(user: AuthUser): DataProfileFormValues {
  return {
    name: user.name ?? '',
    phone: user.phone ?? '',
    address: '',
  };
}

function createPharmacyInitialValues(user: AuthUser): PharmacyContactFormValues {
  return {
    address: '12 Central Street, Kyiv',
    phone: user.phone || '+380501112233',
    email: user.email || 'green.cross@example.com',
    workingHours: 'Mon–Fri: 08:00–20:00, Sat–Sun: 09:00–18:00',
  };
}

function createAboutInitialValues(): PharmacyAboutFormValues {
  return {
    description:
      'Green Cross Pharmacy helps clients quickly reserve products, compare availability, and pick up orders safely.',
  };
}

function createPaymentInitialValues(user: AuthUser): PharmacyPaymentFormValues {
  return {
    recipientName: 'Green Cross Pharmacy LLC',
    taxId: '12345678',
    iban: 'UA123456789012345678901234567',
    bankName: 'E-PHARMACY Bank',
    receiptEmail: user.email || 'green.cross@example.com',
    paymentPurpose: 'Payment for reserved pharmacy products.',
  };
}

function createTouchedUpdater<TValues extends object>(
  setTouched: Dispatch<SetStateAction<Partial<Record<keyof TValues, boolean>>>>,
  field: keyof TValues
) {
  setTouched((current) => ({ ...current, [field]: true }));
}

//===================================================================

function PharmacyProfilePageContent() {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady || !user) {
    return <PageLoader label="Loading pharmacy profile..." />;
  }

  return <PharmacyProfilePage key={user.id ?? user.email} user={user} />;
}

type PharmacyProfilePageProps = Readonly<{
  user: AuthUser;
}>;

function PharmacyProfilePage({ user }: PharmacyProfilePageProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>('data');
  const [pharmacyStatus, setPharmacyStatus] = useState<PharmacyStatus>('new');

  const ownerInitialValues = useMemo(() => createOwnerInitialValues(user), [user]);
  const pharmacyInitialSeed = useMemo(() => createPharmacyInitialValues(user), [user]);
  const paymentInitialSeed = useMemo(() => createPaymentInitialValues(user), [user]);
  const aboutInitialSeed = useMemo(() => createAboutInitialValues(), []);

  const [ownerValues, setOwnerValues] = useState<DataProfileFormValues>(ownerInitialValues);
  const [initialOwnerValues, setInitialOwnerValues] = useState<DataProfileFormValues>(ownerInitialValues);
  const [ownerTouched, setOwnerTouched] = useState<DataProfileTouchedFields>({});

  const [passwordValues, setPasswordValues] = useState<ChangePasswordFormValues>(CHANGE_PASSWORD_INITIAL_VALUES);
  const [passwordTouched, setPasswordTouched] = useState<ChangePasswordTouchedFields>({});
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);

  const [pictureUrl, setPictureUrl] = useState<string | null>(user.pictureUrl ?? null);
  const [pharmacyPictureUrl, setPharmacyPictureUrl] = useState<string | null>(null);

  const [pharmacyValues, setPharmacyValues] = useState<PharmacyContactFormValues>(pharmacyInitialSeed);
  const [initialPharmacyValues, setInitialPharmacyValues] = useState<PharmacyContactFormValues>(pharmacyInitialSeed);
  const [pharmacyTouched, setPharmacyTouched] = useState<PharmacyContactTouchedFields>({});

  const [aboutValues, setAboutValues] = useState<PharmacyAboutFormValues>(aboutInitialSeed);
  const [initialAboutValues, setInitialAboutValues] = useState<PharmacyAboutFormValues>(aboutInitialSeed);
  const [aboutTouched, setAboutTouched] = useState<PharmacyAboutTouchedFields>({});

  const [paymentValues, setPaymentValues] = useState<PharmacyPaymentFormValues>(paymentInitialSeed);
  const [initialPaymentValues, setInitialPaymentValues] = useState<PharmacyPaymentFormValues>(paymentInitialSeed);
  const [paymentTouched, setPaymentTouched] = useState<PharmacyPaymentTouchedFields>({});

  const [isOwnerSaving, setIsOwnerSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isPictureSaving, setIsPictureSaving] = useState(false);
  const [isPharmacyPictureSaving, setIsPharmacyPictureSaving] = useState(false);
  const [isPharmacySaving, setIsPharmacySaving] = useState(false);

  const ownerErrors = useMemo(() => validateDataProfileForm(ownerValues), [ownerValues]);
  const passwordErrors = useMemo(() => validateChangePasswordForm(passwordValues), [passwordValues]);
  const pharmacyErrors = useMemo(() => validatePharmacyContactForm(pharmacyValues), [pharmacyValues]);
  const aboutErrors = useMemo(() => validatePharmacyAboutForm(aboutValues), [aboutValues]);
  const paymentErrors = useMemo(() => validatePharmacyPaymentForm(paymentValues), [paymentValues]);

  const ownerFormIsDirty = isDataProfileFormDirty(ownerValues, initialOwnerValues);
  const ownerFormIsValid = isDataProfileFormValid(ownerValues);
  const passwordFormIsDirty = isChangePasswordFormDirty(passwordValues);
  const passwordFormIsValid = isChangePasswordFormValid(passwordValues);
  const pharmacyFormIsDirty = isPharmacyContactFormDirty(pharmacyValues, initialPharmacyValues);
  const aboutFormIsDirty = isPharmacyAboutFormDirty(aboutValues, initialAboutValues);
  const paymentFormIsDirty = isPharmacyPaymentFormDirty(paymentValues, initialPaymentValues);
  const isModerationLocked = pharmacyStatus === 'on_moderation';

  const canSendForVerification =
    !hasValidationErrors(pharmacyErrors) &&
    !hasValidationErrors(aboutErrors) &&
    !hasValidationErrors(paymentErrors) &&
    !isModerationLocked;

  const tabs = useMemo(
    () =>
      TABS.map((tab) =>
        tab.value === 'reviews'
          ? { ...tab, label: `Reviews (${DEMO_REVIEWS.length})` }
          : tab
      ),
    []
  );

  const handleOwnerChange = (field: keyof DataProfileFormValues, value: string) => {
    createTouchedUpdater(setOwnerTouched, field);
    setOwnerValues((current) => ({ ...current, [field]: value }));
  };

  const handlePasswordChange = (field: keyof ChangePasswordFormValues, value: string) => {
    createTouchedUpdater(setPasswordTouched, field);
    setPasswordValues((current) => ({ ...current, [field]: value }));
  };

  const handlePharmacyChange = (field: keyof PharmacyContactFormValues, value: string) => {
    createTouchedUpdater(setPharmacyTouched, field);
    setPharmacyValues((current) => ({ ...current, [field]: value }));
  };

  const handleAboutChange = (value: string) => {
    setAboutTouched((current) => ({ ...current, description: true }));
    setAboutValues({ description: value });
  };

  const handlePaymentChange = (field: keyof PharmacyPaymentFormValues, value: string) => {
    createTouchedUpdater(setPaymentTouched, field);
    setPaymentValues((current) => ({ ...current, [field]: value }));
  };

  const handlePictureError = (message: string) => toast.error(message);

  const handleProfilePictureChange = async (nextPictureUrl: string | null) => {
    setIsPictureSaving(true);
    window.setTimeout(() => {
      setPictureUrl(nextPictureUrl);
      setIsPictureSaving(false);
      toast.success(nextPictureUrl ? 'Profile photo was updated.' : 'Profile photo was removed.');
    }, 250);
  };

  const handlePharmacyPictureChange = async (nextPictureUrl: string | null) => {
    setIsPharmacyPictureSaving(true);
    window.setTimeout(() => {
      setPharmacyPictureUrl(nextPictureUrl);
      setIsPharmacyPictureSaving(false);
      toast.success(nextPictureUrl ? 'Pharmacy photo was updated.' : 'Pharmacy photo was removed.');
    }, 250);
  };

  const handleOwnerSubmit = () => {
    setOwnerTouched(markAllFieldsTouched(DATA_PROFILE_FORM_FIELDS));

    if (!ownerFormIsValid || !ownerFormIsDirty) return;

    setIsOwnerSaving(true);
    window.setTimeout(() => {
      setInitialOwnerValues(ownerValues);
      setOwnerTouched({});
      setIsOwnerSaving(false);
      toast.success('Owner data saved successfully.');
    }, 350);
  };

  const handlePasswordSubmit = () => {
    setPasswordTouched(markAllFieldsTouched(CHANGE_PASSWORD_FORM_FIELDS));

    if (!passwordFormIsValid || !passwordFormIsDirty) return;

    setIsPasswordSaving(true);
    window.setTimeout(() => {
      setPasswordValues(CHANGE_PASSWORD_INITIAL_VALUES);
      setPasswordTouched({});
      setIsPasswordSaving(false);
      toast.success('Password changed successfully.');
    }, 350);
  };

  const handlePharmacySubmit = () => {
    setPharmacyTouched(markAllFieldsTouched(PHARMACY_CONTACT_FORM_FIELDS));

    if (hasValidationErrors(pharmacyErrors) || !pharmacyFormIsDirty || isModerationLocked) return;

    setIsPharmacySaving(true);
    window.setTimeout(() => {
      setInitialPharmacyValues(pharmacyValues);
      setPharmacyTouched({});
      setIsPharmacySaving(false);
      toast.success('Pharmacy data saved successfully.');
    }, 350);
  };

  const handleAboutSubmit = () => {
    setAboutTouched(markAllFieldsTouched(PHARMACY_ABOUT_FORM_FIELDS));

    if (hasValidationErrors(aboutErrors) || !aboutFormIsDirty || isModerationLocked) return;

    setIsPharmacySaving(true);
    window.setTimeout(() => {
      setInitialAboutValues(aboutValues);
      setAboutTouched({});
      setIsPharmacySaving(false);
      toast.success('About pharmacy saved successfully.');
    }, 350);
  };

  const handlePaymentSubmit = () => {
    setPaymentTouched(markAllFieldsTouched(PHARMACY_PAYMENT_FORM_FIELDS));

    if (hasValidationErrors(paymentErrors) || !paymentFormIsDirty || isModerationLocked) return;

    setIsPharmacySaving(true);
    window.setTimeout(() => {
      setInitialPaymentValues(paymentValues);
      setPaymentTouched({});
      setIsPharmacySaving(false);
      toast.success('Payment details saved successfully.');
    }, 350);
  };

  const handleSendForVerification = () => {
    setPharmacyTouched(markAllFieldsTouched(PHARMACY_CONTACT_FORM_FIELDS));
    setAboutTouched(markAllFieldsTouched(PHARMACY_ABOUT_FORM_FIELDS));
    setPaymentTouched(markAllFieldsTouched(PHARMACY_PAYMENT_FORM_FIELDS));

    if (!canSendForVerification) return;

    setPharmacyStatus('on_moderation');
    toast.success('Pharmacy profile was sent for verification.');
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
            Manage owner data, pharmacy public data, payment details, reviews, and sessions.
          </p>

          <div className={css.profileShell}>
            <aside className={css.sidebar} aria-label="Pharmacy profile summary">
              <PictureCard
                name={user.name}
                pictureUrl={pictureUrl}
                isSaving={isPictureSaving}
                accept={PICTURE_ACCEPT}
                validateFile={(file) => buildPictureFileError(file) || null}
                validatePictureUrl={(nextPictureUrl) => buildPictureUrlError(nextPictureUrl) || null}
                onChange={handleProfilePictureChange}
                onError={handlePictureError}
              />

              <div className={css.nameBlock}>
                <h2 className={css.name}>{user.name}</h2>
                <p className={css.email}>{user.email}</p>
              </div>

              <dl className={css.compactDetails}>
                <div>
                  <dt>Role</dt>
                  <dd>{formatCapitalizedLabel(user.role)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{formatCapitalizedLabel(pharmacyStatus)}</dd>
                </div>
              </dl>

              <div className={css.statusNote}>
                <h3>{pharmacyStatus === 'on_moderation' ? 'Verification requested' : 'Verification required'}</h3>
                <p>
                  {pharmacyStatus === 'on_moderation'
                    ? 'Your pharmacy data is waiting for admin review.'
                    : 'Complete required pharmacy data, about pharmacy, and payment details before sending the pharmacy for verification.'}
                </p>
              </div>

              <Button
                type="button"
                fullWidth
                disabled={!canSendForVerification}
                onClick={handleSendForVerification}
              >
                {pharmacyStatus === 'active' ? 'Send for moderation' : 'Send for verification'}
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
                        isTouched={Boolean(ownerTouched.name)}
                        maxLength={USER_NAME_MAX_LENGTH}
                        onChange={(event) => handleOwnerChange('name', sanitizeName(event.target.value))}
                      />

                      <PhoneInput
                        id="owner-phone"
                        name="ownerPhone"
                        value={ownerValues.phone}
                        error={ownerErrors.phone}
                        isTouched={Boolean(ownerTouched.phone)}
                        maxLength={USER_PHONE_MAX_LENGTH}
                        onChange={(event) => handleOwnerChange('phone', sanitizePhone(event.target.value))}
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={!ownerFormIsValid || !ownerFormIsDirty || isOwnerSaving}
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
                        isTouched={Boolean(passwordTouched.currentPassword)}
                        isVisible={isCurrentPasswordVisible}
                        maxLength={USER_PASSWORD_MAX_LENGTH}
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
                        isTouched={Boolean(passwordTouched.newPassword)}
                        isVisible={isNewPasswordVisible}
                        maxLength={USER_PASSWORD_MAX_LENGTH}
                        onChange={(event) => handlePasswordChange('newPassword', sanitizePassword(event.target.value))}
                        onToggleVisibility={() => setIsNewPasswordVisible((value) => !value)}
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={!passwordFormIsValid || !passwordFormIsDirty || isPasswordSaving}
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
                      accept={PICTURE_ACCEPT}
                      labels={{
                        uploadAriaLabel: 'Upload pharmacy photo',
                        hint: 'Upload a lightweight JPG, PNG, or WEBP image up to 450 KB. The photo is saved right away.',
                        uploadButton: 'Upload pharmacy photo',
                        removeButton: 'Remove pharmacy photo',
                      }}
                      validateFile={(file) => buildPictureFileError(file) || null}
                      validatePictureUrl={(nextPictureUrl) => buildPictureUrlError(nextPictureUrl) || null}
                      onChange={handlePharmacyPictureChange}
                      onError={handlePictureError}
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
                        isTouched={Boolean(pharmacyTouched.address)}
                        maxLength={USER_ADDRESS_MAX_LENGTH}
                        disabled={isModerationLocked}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                          handlePharmacyChange('address', sanitizeAddress(event.target.value))
                        }
                      />

                      <PhoneInput
                        id="pharmacy-phone"
                        name="pharmacyPhone"
                        value={pharmacyValues.phone}
                        error={pharmacyErrors.phone}
                        isTouched={Boolean(pharmacyTouched.phone)}
                        maxLength={USER_PHONE_MAX_LENGTH}
                        disabled={isModerationLocked}
                        onChange={(event) => handlePharmacyChange('phone', sanitizePhone(event.target.value))}
                      />

                      <EmailInput
                        id="pharmacy-email"
                        name="pharmacyEmail"
                        value={pharmacyValues.email}
                        error={pharmacyErrors.email}
                        isTouched={Boolean(pharmacyTouched.email)}
                        maxLength={USER_EMAIL_MAX_LENGTH}
                        disabled={isModerationLocked}
                        onChange={(event) => handlePharmacyChange('email', sanitizeEmail(event.target.value))}
                      />

                      <WorkingHoursInput
                        id="pharmacy-working-hours"
                        name="workingHours"
                        value={pharmacyValues.workingHours}
                        error={pharmacyErrors.workingHours}
                        isTouched={Boolean(pharmacyTouched.workingHours)}
                        maxLength={WORKING_HOURS_MAX_LENGTH}
                        disabled={isModerationLocked}
                        onChange={(event) => handlePharmacyChange('workingHours', sanitizeWorkingHours(event.target.value))}
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={hasValidationErrors(pharmacyErrors) || !pharmacyFormIsDirty || isPharmacySaving || isModerationLocked}
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

                    <TextEditor
                      id="pharmacy-description"
                      name="pharmacyDescription"
                      label="Description"
                      value={aboutValues.description}
                      error={aboutErrors.description}
                      isTouched={Boolean(aboutTouched.description)}
                      maxLength={TEXT_EDITOR_MAX_LENGTH}
                      disabled={isModerationLocked}
                      onChange={(event) => handleAboutChange(sanitizeTextEditor(event.target.value))}
                    />

                    <Button
                      type="button"
                      disabled={hasValidationErrors(aboutErrors) || !aboutFormIsDirty || isPharmacySaving || isModerationLocked}
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
                        isTouched={Boolean(paymentTouched.recipientName)}
                        disabled={isModerationLocked}
                        maxLength={USER_NAME_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('recipientName', sanitizeName(event.target.value))}
                      />

                      <TaxIdInput
                        id="tax-id"
                        name="taxId"
                        value={paymentValues.taxId}
                        error={paymentErrors.taxId}
                        isTouched={Boolean(paymentTouched.taxId)}
                        disabled={isModerationLocked}
                        maxLength={TAX_ID_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('taxId', sanitizeTaxId(event.target.value))}
                      />

                      <IbanInput
                        id="iban"
                        name="iban"
                        className={css.fieldWide}
                        value={paymentValues.iban}
                        error={paymentErrors.iban}
                        isTouched={Boolean(paymentTouched.iban)}
                        disabled={isModerationLocked}
                        maxLength={IBAN_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('iban', sanitizeIban(event.target.value))}
                      />

                      <NameInput
                        id="bank-name"
                        name="bankName"
                        label="Bank name"
                        value={paymentValues.bankName}
                        error={paymentErrors.bankName}
                        isTouched={Boolean(paymentTouched.bankName)}
                        disabled={isModerationLocked}
                        maxLength={USER_NAME_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('bankName', sanitizeName(event.target.value))}
                      />

                      <EmailInput
                        id="receipt-email"
                        name="receiptEmail"
                        label="Receipt email"
                        value={paymentValues.receiptEmail}
                        error={paymentErrors.receiptEmail}
                        isTouched={Boolean(paymentTouched.receiptEmail)}
                        disabled={isModerationLocked}
                        maxLength={USER_EMAIL_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('receiptEmail', sanitizeEmail(event.target.value))}
                      />

                      <CommentInput
                        id="payment-purpose"
                        name="paymentPurpose"
                        label="Payment purpose"
                        className={css.fieldWide}
                        value={paymentValues.paymentPurpose}
                        error={paymentErrors.paymentPurpose}
                        isTouched={Boolean(paymentTouched.paymentPurpose)}
                        required
                        disabled={isModerationLocked}
                        maxLength={PAYMENT_PURPOSE_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('paymentPurpose', sanitizePaymentPurpose(event.target.value))}
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={hasValidationErrors(paymentErrors) || !paymentFormIsDirty || isPharmacySaving || isModerationLocked}
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
