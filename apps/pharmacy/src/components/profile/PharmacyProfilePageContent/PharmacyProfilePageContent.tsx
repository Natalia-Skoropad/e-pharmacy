'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { FileText, KeyRound, MonitorSmartphone } from 'lucide-react';

import {
  Button,
  Container,
  LoadingSpinner,
  PictureCard,
  ReviewsList,
  StatusBadge,
  StatusBanner,
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
import { formatOrderDateTime } from '@e-pharmacy/utils/formatters';

import type {
  ActiveSession,
  PharmacyProfile,
  PharmacyStatus,
  UpdateMyPharmacyProfilePayload,
} from '@e-pharmacy/types';

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

import {
  getActiveSessions,
  getMyPharmacyProfile,
  revokeActiveSession,
  sendMyPharmacyForVerification,
  updateCurrentUser,
  updateCurrentUserPassword,
  updateMyPharmacyProfile,
} from '@/lib/api/browser';

import { PHARMACY_STATUS_LABELS } from '@/lib/pharmacy/status';
import { getProfileBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

import css from './PharmacyProfilePageContent.module.css';

//===================================================================

type AuthUser = NonNullable<ReturnType<typeof useAuth>['user']>;

type ProfileTab =
  | 'data'
  | 'pharmacy-data'
  | 'about'
  | 'payment'
  | 'documents'
  | 'reviews'
  | 'sessions';


type ProfileStatusBadgeVariant = 'new' | 'on_moderation' | 'active' | 'blocked';

//===================================================================

const INITIAL_VISIBLE_REVIEWS_COUNT = 10;

const TABS: Array<{ value: ProfileTab; label: string }> = [
  { value: 'data', label: 'My data' },
  { value: 'pharmacy-data', label: 'Pharmacy data' },
  { value: 'about', label: 'About pharmacy' },
  { value: 'payment', label: 'Payment details' },
  { value: 'documents', label: 'Documents' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'sessions', label: 'Active sessions' },
];

//===================================================================

function createOwnerInitialValues(user: AuthUser): DataProfileFormValues {
  return {
    name: user.name ?? '',
    phone: user.phone ?? '',
    address: user.address ?? '',
  };
}

function createPharmacyInitialValues(
  user: AuthUser,
  pharmacy: PharmacyProfile
): PharmacyContactFormValues {
  return {
    address: pharmacy.address ?? user.address ?? '',
    phone: pharmacy.phone ?? user.phone ?? '',
    email: pharmacy.email ?? user.email ?? '',
    workingHours: pharmacy.workingHours ?? '',
  };
}

function createAboutInitialValues(pharmacy: PharmacyProfile): PharmacyAboutFormValues {
  return {
    description: pharmacy.description ?? '',
  };
}

function createPaymentInitialValues(
  user: AuthUser,
  pharmacy: PharmacyProfile
): PharmacyPaymentFormValues {
  return {
    recipientName: pharmacy.bankDetails?.recipientName ?? pharmacy.name ?? user.name ?? '',
    taxId: pharmacy.bankDetails?.taxId ?? '',
    iban: pharmacy.bankDetails?.iban ?? '',
    bankName: pharmacy.bankDetails?.bankName ?? '',
    receiptEmail: pharmacy.bankDetails?.receiptEmail ?? pharmacy.email ?? user.email ?? '',
    paymentPurpose: pharmacy.bankDetails?.paymentPurpose ?? '',
  };
}

function createTouchedUpdater<TValues extends object>(
  setTouched: Dispatch<SetStateAction<Partial<Record<keyof TValues, boolean>>>>,
  field: keyof TValues
) {
  setTouched((current) => ({ ...current, [field]: true }));
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getStatusLabel(status: PharmacyStatus): string {
  return PHARMACY_STATUS_LABELS[status] ?? status;
}


function getStatusBadgeStatus(status: PharmacyStatus): ProfileStatusBadgeVariant {
  return status === 'on_verification' ? 'on_moderation' : status;
}

function isReadonlyStatus(status: PharmacyStatus): boolean {
  return status === 'on_verification' || status === 'on_moderation';
}

function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return 'Unknown size';

  const kilobytes = size / 1024;
  if (kilobytes < 1024) return `${kilobytes.toFixed(1)} KB`;

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function formatSessionDate(value: string): string {
  if (!value) return 'Unknown';

  try {
    return formatOrderDateTime(value);
  } catch {
    return value;
  }
}

function buildProfilePayload(
  values: PharmacyContactFormValues,
  pharmacyName: string
): UpdateMyPharmacyProfilePayload {
  return {
    name: pharmacyName.trim(),
    address: values.address.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    workingHours: values.workingHours.trim(),
  };
}

function buildAboutPayload(values: PharmacyAboutFormValues): UpdateMyPharmacyProfilePayload {
  return {
    description: values.description.trim(),
  };
}

function buildPaymentPayload(values: PharmacyPaymentFormValues): UpdateMyPharmacyProfilePayload {
  return {
    bankDetails: {
      recipientName: values.recipientName.trim(),
      taxId: values.taxId.trim(),
      iban: values.iban.trim(),
      bankName: values.bankName.trim(),
      receiptEmail: values.receiptEmail.trim(),
      paymentPurpose: values.paymentPurpose.trim(),
    },
  };
}

function hasDocuments(pharmacy: PharmacyProfile): boolean {
  return pharmacy.documents.length > 0;
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
  const { reloadCurrentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ProfileTab>('data');
  const [pharmacy, setPharmacy] = useState<PharmacyProfile | null>(null);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [ownerValues, setOwnerValues] = useState<DataProfileFormValues>(() =>
    createOwnerInitialValues(user)
  );
  const [initialOwnerValues, setInitialOwnerValues] = useState<DataProfileFormValues>(() =>
    createOwnerInitialValues(user)
  );
  const [ownerTouched, setOwnerTouched] = useState<DataProfileTouchedFields>({});

  const [passwordValues, setPasswordValues] = useState<ChangePasswordFormValues>(CHANGE_PASSWORD_INITIAL_VALUES);
  const [passwordTouched, setPasswordTouched] = useState<ChangePasswordTouchedFields>({});
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);

  const [pictureUrl, setPictureUrl] = useState<string | null>(user.pictureUrl ?? null);
  const [pharmacyName, setPharmacyName] = useState('');
  const [initialPharmacyName, setInitialPharmacyName] = useState('');
  const [pharmacyPictureUrl, setPharmacyPictureUrl] = useState<string | null>(null);

  const [pharmacyValues, setPharmacyValues] = useState<PharmacyContactFormValues>({
    address: '',
    phone: '',
    email: '',
    workingHours: '',
  });
  const [initialPharmacyValues, setInitialPharmacyValues] = useState<PharmacyContactFormValues>(pharmacyValues);
  const [pharmacyTouched, setPharmacyTouched] = useState<PharmacyContactTouchedFields>({});

  const [aboutValues, setAboutValues] = useState<PharmacyAboutFormValues>({ description: '' });
  const [initialAboutValues, setInitialAboutValues] = useState<PharmacyAboutFormValues>(aboutValues);
  const [aboutTouched, setAboutTouched] = useState<PharmacyAboutTouchedFields>({});

  const [paymentValues, setPaymentValues] = useState<PharmacyPaymentFormValues>({
    recipientName: '',
    taxId: '',
    iban: '',
    bankName: '',
    receiptEmail: '',
    paymentPurpose: '',
  });
  const [initialPaymentValues, setInitialPaymentValues] = useState<PharmacyPaymentFormValues>(paymentValues);
  const [paymentTouched, setPaymentTouched] = useState<PharmacyPaymentTouchedFields>({});

  const [isOwnerSaving, setIsOwnerSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isPictureSaving, setIsPictureSaving] = useState(false);
  const [isPharmacyPictureSaving, setIsPharmacyPictureSaving] = useState(false);
  const [isPharmacySaving, setIsPharmacySaving] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoadingProfile(true);
      setLoadError(null);

      try {
        const response = await getMyPharmacyProfile();
        if (!isMounted) return;

        const nextPharmacy = response.pharmacy;
        const nextPharmacyValues = createPharmacyInitialValues(user, nextPharmacy);
        const nextAboutValues = createAboutInitialValues(nextPharmacy);
        const nextPaymentValues = createPaymentInitialValues(user, nextPharmacy);

        setPharmacy(nextPharmacy);
        setPharmacyName(nextPharmacy.name);
        setInitialPharmacyName(nextPharmacy.name);
        setPharmacyPictureUrl(nextPharmacy.imageUrl ?? null);
        setPharmacyValues(nextPharmacyValues);
        setInitialPharmacyValues(nextPharmacyValues);
        setAboutValues(nextAboutValues);
        setInitialAboutValues(nextAboutValues);
        setPaymentValues(nextPaymentValues);
        setInitialPaymentValues(nextPaymentValues);
      } catch (error) {
        if (!isMounted) return;
        setLoadError(getErrorMessage(error, 'Could not load pharmacy profile.'));
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      setIsLoadingSessions(true);

      try {
        const response = await getActiveSessions();
        if (isMounted) setSessions(response.sessions);
      } catch {
        if (isMounted) setSessions([]);
      } finally {
        if (isMounted) setIsLoadingSessions(false);
      }
    }

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  const ownerErrors = useMemo(() => validateDataProfileForm(ownerValues), [ownerValues]);
  const passwordErrors = useMemo(() => validateChangePasswordForm(passwordValues), [passwordValues]);
  const pharmacyErrors = useMemo(() => validatePharmacyContactForm(pharmacyValues), [pharmacyValues]);
  const aboutErrors = useMemo(() => validatePharmacyAboutForm(aboutValues), [aboutValues]);
  const paymentErrors = useMemo(() => validatePharmacyPaymentForm(paymentValues), [paymentValues]);

  const ownerFormIsDirty = isDataProfileFormDirty(ownerValues, initialOwnerValues);
  const ownerFormIsValid = isDataProfileFormValid(ownerValues);
  const passwordFormIsDirty = isChangePasswordFormDirty(passwordValues);
  const passwordFormIsValid = isChangePasswordFormValid(passwordValues);
  const pharmacyNameIsDirty = pharmacyName.trim() !== initialPharmacyName.trim();
  const pharmacyFormIsDirty =
    pharmacyNameIsDirty || isPharmacyContactFormDirty(pharmacyValues, initialPharmacyValues);
  const aboutFormIsDirty = isPharmacyAboutFormDirty(aboutValues, initialAboutValues);
  const paymentFormIsDirty = isPharmacyPaymentFormDirty(paymentValues, initialPaymentValues);
  const pharmacyStatus = pharmacy?.status ?? 'new';
  const isProfileReadonly = isReadonlyStatus(pharmacyStatus);
  const pharmacyNameIsValid = pharmacyName.trim().length > 0;
  const pharmacyDocumentsAreReady = pharmacy ? hasDocuments(pharmacy) : false;

  const canSendForVerification =
    Boolean(pharmacy) &&
    pharmacyStatus === 'new' &&
    pharmacyDocumentsAreReady &&
    pharmacyNameIsValid &&
    !hasValidationErrors(pharmacyErrors) &&
    !hasValidationErrors(aboutErrors) &&
    !hasValidationErrors(paymentErrors) &&
    !isPharmacySaving &&
    !isSendingVerification;

  const reviewsCount = pharmacy?.reviewsCount ?? 0;
  const documentsCount = pharmacy?.documents.length ?? 0;

  const tabs = TABS.map((tab) => {
    if (tab.value === 'reviews') {
      return { ...tab, label: `Reviews (${reviewsCount})` };
    }

    if (tab.value === 'documents') {
      return { ...tab, label: `Documents (${documentsCount})` };
    }

    return tab;
  });

  const handleOwnerChange = (field: keyof DataProfileFormValues, value: string) => {
    createTouchedUpdater(setOwnerTouched, field);
    setOwnerValues((current) => ({ ...current, [field]: value }));
  };

  const handlePasswordChange = (field: keyof ChangePasswordFormValues, value: string) => {
    createTouchedUpdater(setPasswordTouched, field);
    setPasswordValues((current) => ({ ...current, [field]: value }));
  };

  const handlePharmacyNameChange = (value: string) => {
    setPharmacyName(value);
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

    try {
      const response = await updateCurrentUser({ pictureUrl: nextPictureUrl });
      setPictureUrl(response.user.pictureUrl ?? null);
      await reloadCurrentUser();
      toast.success(nextPictureUrl ? 'Profile photo was updated.' : 'Profile photo was removed.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update profile photo.'));
    } finally {
      setIsPictureSaving(false);
    }
  };

  const handlePharmacyPictureChange = async (nextPictureUrl: string | null) => {
    if (!pharmacy || isProfileReadonly) return;

    setIsPharmacyPictureSaving(true);

    try {
      const response = await updateMyPharmacyProfile({ imageUrl: nextPictureUrl });
      setPharmacy(response.pharmacy);
      setPharmacyPictureUrl(response.pharmacy.imageUrl ?? null);
      toast.success(nextPictureUrl ? 'Pharmacy photo was updated.' : 'Pharmacy photo was removed.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update pharmacy photo.'));
    } finally {
      setIsPharmacyPictureSaving(false);
    }
  };

  const handleOwnerSubmit = async () => {
    setOwnerTouched(markAllFieldsTouched(DATA_PROFILE_FORM_FIELDS));

    if (!ownerFormIsValid || !ownerFormIsDirty) return;

    setIsOwnerSaving(true);

    try {
      const response = await updateCurrentUser({
        name: ownerValues.name.trim(),
        phone: ownerValues.phone.trim(),
        address: ownerValues.address.trim() || undefined,
      });

      const nextValues = createOwnerInitialValues(response.user);
      setOwnerValues(nextValues);
      setInitialOwnerValues(nextValues);
      setOwnerTouched({});
      await reloadCurrentUser();
      toast.success('Owner data saved successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save owner data.'));
    } finally {
      setIsOwnerSaving(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setPasswordTouched(markAllFieldsTouched(CHANGE_PASSWORD_FORM_FIELDS));

    if (!passwordFormIsValid || !passwordFormIsDirty) return;

    setIsPasswordSaving(true);

    try {
      await updateCurrentUserPassword({
        currentPassword: passwordValues.currentPassword,
        newPassword: passwordValues.newPassword,
      });
      setPasswordValues(CHANGE_PASSWORD_INITIAL_VALUES);
      setPasswordTouched({});
      toast.success('Password changed successfully. Please sign in again if the session was refreshed.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not change password.'));
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handlePharmacySubmit = async () => {
    setPharmacyTouched(markAllFieldsTouched(PHARMACY_CONTACT_FORM_FIELDS));

    if (
      !pharmacy ||
      !pharmacyNameIsValid ||
      hasValidationErrors(pharmacyErrors) ||
      !pharmacyFormIsDirty ||
      isProfileReadonly
    ) {
      return;
    }

    setIsPharmacySaving(true);

    try {
      const response = await updateMyPharmacyProfile(
        buildProfilePayload(pharmacyValues, pharmacyName)
      );
      const nextValues = createPharmacyInitialValues(user, response.pharmacy);
      setPharmacy(response.pharmacy);
      setPharmacyName(response.pharmacy.name);
      setInitialPharmacyName(response.pharmacy.name);
      setPharmacyValues(nextValues);
      setInitialPharmacyValues(nextValues);
      setPharmacyTouched({});
      toast.success('Pharmacy data saved successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save pharmacy data.'));
    } finally {
      setIsPharmacySaving(false);
    }
  };

  const handleAboutSubmit = async () => {
    setAboutTouched(markAllFieldsTouched(PHARMACY_ABOUT_FORM_FIELDS));

    if (!pharmacy || hasValidationErrors(aboutErrors) || !aboutFormIsDirty || isProfileReadonly) return;

    setIsPharmacySaving(true);

    try {
      const response = await updateMyPharmacyProfile(buildAboutPayload(aboutValues));
      const nextValues = createAboutInitialValues(response.pharmacy);
      setPharmacy(response.pharmacy);
      setAboutValues(nextValues);
      setInitialAboutValues(nextValues);
      setAboutTouched({});
      toast.success('About pharmacy saved successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save about pharmacy.'));
    } finally {
      setIsPharmacySaving(false);
    }
  };

  const handlePaymentSubmit = async () => {
    setPaymentTouched(markAllFieldsTouched(PHARMACY_PAYMENT_FORM_FIELDS));

    if (!pharmacy || hasValidationErrors(paymentErrors) || !paymentFormIsDirty || isProfileReadonly) return;

    setIsPharmacySaving(true);

    try {
      const response = await updateMyPharmacyProfile(buildPaymentPayload(paymentValues));
      const nextValues = createPaymentInitialValues(user, response.pharmacy);
      setPharmacy(response.pharmacy);
      setPaymentValues(nextValues);
      setInitialPaymentValues(nextValues);
      setPaymentTouched({});
      toast.success('Payment details saved successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save payment details.'));
    } finally {
      setIsPharmacySaving(false);
    }
  };

  const handleSendForVerification = async () => {
    setPharmacyTouched(markAllFieldsTouched(PHARMACY_CONTACT_FORM_FIELDS));
    setAboutTouched(markAllFieldsTouched(PHARMACY_ABOUT_FORM_FIELDS));
    setPaymentTouched(markAllFieldsTouched(PHARMACY_PAYMENT_FORM_FIELDS));

    if (!canSendForVerification) return;

    setIsSendingVerification(true);

    try {
      const response = await sendMyPharmacyForVerification();
      setPharmacy(response.pharmacy);
      toast.success(response.message);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send pharmacy for verification.'));
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);

    try {
      await revokeActiveSession(sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      toast.success('Session was revoked.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not revoke session.'));
    } finally {
      setRevokingSessionId(null);
    }
  };

  if (isLoadingProfile) {
    return <PageLoader label="Loading pharmacy profile..." />;
  }

  if (loadError || !pharmacy) {
    return (
      <main className={css.page}>
        <section className={css.section} aria-labelledby="pharmacy-profile-title">
          <Container className={css.profileContainer}>
            <Breadcrumbs items={getProfileBreadcrumbs()} />
            <StatusBanner
              status="rejected"
              title="Pharmacy profile could not be loaded"
              message={loadError ?? 'Please refresh the page and try again.'}
            />
          </Container>
        </section>
      </main>
    );
  }

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="pharmacy-profile-title">
        <Container className={css.profileContainer}>
          <Breadcrumbs items={getProfileBreadcrumbs()} />

          <h1 className={css.title} id="pharmacy-profile-title">
            Pharmacy profile
          </h1>

          <p className={css.text}>
            Manage real owner data, pharmacy public data, payment details, documents, reviews, and sessions.
          </p>

          <div className={css.profileShell}>
            <aside className={css.sidebar} aria-label="Pharmacy profile summary">
              <PictureCard
                name={pharmacy.name}
                pictureUrl={pharmacyPictureUrl}
                isSaving={isPharmacyPictureSaving}
                accept={PICTURE_ACCEPT}
                validateFile={(file) => buildPictureFileError(file) || null}
                validatePictureUrl={(nextPictureUrl) => buildPictureUrlError(nextPictureUrl) || null}
                onChange={handlePharmacyPictureChange}
                onError={handlePictureError}
              />

              <div className={css.nameBlock}>
                <p className={css.name}>{pharmacy.name}</p>
                <p className={css.email}>{pharmacy.email ?? user.email}</p>
              </div>

              <dl className={css.compactDetails}>
                <div>
                  <dt>Role</dt>
                  <dd>Pharmacy</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{getStatusLabel(pharmacy.status)}</dd>
                </div>
                <div>
                  <dt>Documents</dt>
                  <dd>{pharmacy.documents.length}</dd>
                </div>
              </dl>

              <div className={css.statusNote}>
                <div className={css.statusNoteHeader}>
                  <h3>Profile status</h3>
                  <StatusBadge status={getStatusBadgeStatus(pharmacy.status)} label={getStatusLabel(pharmacy.status)} />
                </div>
                {pharmacy.status === 'new' ? (
                  <p>
                    New pharmacies can edit registration data and complete required fields. Sales, orders, own products, clients, and product requests unlock after verification.
                  </p>
                ) : null}
                {pharmacy.status === 'on_verification' ? (
                  <p>
                    The profile is waiting for Admin verification. Submitted fields are read-only until the decision is made.
                  </p>
                ) : null}
                {pharmacy.status === 'active' ? (
                  <p>The pharmacy is active. Important public changes may require moderation.</p>
                ) : null}
                {pharmacy.status === 'on_moderation' ? (
                  <p>Profile changes are on moderation. Approved public data remains visible until Admin reviews the changes.</p>
                ) : null}
              </div>

              {pharmacy.status === 'new' ? (
                <Button
                  type="button"
                  fullWidth
                  disabled={!canSendForVerification}
                  isLoading={isSendingVerification}
                  loadingLabel="Sending..."
                  onClick={handleSendForVerification}
                >
                  Send for verification
                </Button>
              ) : null}
            </aside>

            <div className={css.contentCard}>
              <Tabs
                items={tabs}
                activeValue={activeTab}
                ariaLabel="Pharmacy profile sections"
                mobileVisibleCount={1}
                tabletVisibleCount={3}
                onChange={setActiveTab}
              />

              {activeTab === 'data' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section className={css.panelSection} aria-labelledby="owner-data-title">
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="owner-data-title">
                        Owner data
                      </h2>
                      <p className={css.panelText}>
                        These are the real details used when the pharmacy owner registered.
                      </p>
                    </div>

                    <PictureCard
                      name={ownerValues.name || user.name}
                      pictureUrl={pictureUrl}
                      isSaving={isPictureSaving}
                      accept={PICTURE_ACCEPT}
                      validateFile={(file) => buildPictureFileError(file) || null}
                      validatePictureUrl={(nextPictureUrl) => buildPictureUrlError(nextPictureUrl) || null}
                      onChange={handleProfilePictureChange}
                      onError={handlePictureError}
                    />

                    <div className={css.formGrid}>
                      <NameInput
                        id="owner-name"
                        name="name"
                        value={ownerValues.name}
                        error={ownerErrors.name}
                        isTouched={Boolean(ownerTouched.name)}
                        maxLength={USER_NAME_MAX_LENGTH}
                        onChange={(event) => handleOwnerChange('name', sanitizeName(event.target.value))}
                      />

                      <PhoneInput
                        id="owner-phone"
                        name="phone"
                        value={ownerValues.phone}
                        error={ownerErrors.phone}
                        isTouched={Boolean(ownerTouched.phone)}
                        maxLength={USER_PHONE_MAX_LENGTH}
                        onChange={(event) => handleOwnerChange('phone', sanitizePhone(event.target.value))}
                      />

                      <AddressInput
                        id="owner-address"
                        name="address"
                        className={css.fieldWide}
                        value={ownerValues.address}
                        error={ownerErrors.address}
                        isTouched={Boolean(ownerTouched.address)}
                        required={false}
                        maxLength={USER_ADDRESS_MAX_LENGTH}
                        onChange={(event) => handleOwnerChange('address', sanitizeAddress(event.target.value))}
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={!ownerFormIsValid || !ownerFormIsDirty || isOwnerSaving}
                      isLoading={isOwnerSaving}
                      loadingLabel="Saving..."
                      onClick={handleOwnerSubmit}
                    >
                      Save owner data
                    </Button>
                  </section>

                  <section className={css.panelSection} aria-labelledby="password-title">
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="password-title">
                        Change password
                      </h2>
                      <p className={css.panelText}>
                        Use this section only when you want to update the owner login password.
                      </p>
                    </div>

                    <div className={css.formGrid}>
                      <PasswordInput
                        id="current-password"
                        name="currentPassword"
                        label="Current password"
                        value={passwordValues.currentPassword}
                        error={passwordErrors.currentPassword}
                        isTouched={Boolean(passwordTouched.currentPassword)}
                        autoComplete="current-password"
                        maxLength={USER_PASSWORD_MAX_LENGTH}
                        isVisible={isCurrentPasswordVisible}
                        onToggleVisibility={() => setIsCurrentPasswordVisible((value) => !value)}
                        onChange={(event) => handlePasswordChange('currentPassword', sanitizePassword(event.target.value))}
                      />

                      <PasswordInput
                        id="new-password"
                        name="newPassword"
                        label="New password"
                        value={passwordValues.newPassword}
                        error={passwordErrors.newPassword}
                        isTouched={Boolean(passwordTouched.newPassword)}
                        autoComplete="new-password"
                        maxLength={USER_PASSWORD_MAX_LENGTH}
                        isVisible={isNewPasswordVisible}
                        onToggleVisibility={() => setIsNewPasswordVisible((value) => !value)}
                        onChange={(event) => handlePasswordChange('newPassword', sanitizePassword(event.target.value))}
                      />
                    </div>

                    <Button
                      type="button"
                      iconLeft={<KeyRound size={18} aria-hidden="true" />}
                      disabled={!passwordFormIsValid || isPasswordSaving}
                      isLoading={isPasswordSaving}
                      loadingLabel="Saving..."
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
                        Fill in the public pharmacy data required for verification.
                      </p>
                    </div>

                    {isProfileReadonly ? (
                      <StatusBanner
                        status="on_moderation"
                        label={getStatusLabel(pharmacy.status)}
                        title="Profile data is locked"
                        message="The submitted profile is waiting for Admin review. You can view it, but editing is paused until a decision is made."
                      />
                    ) : null}

                    <div className={css.formGrid}>
                      <NameInput
                        id="pharmacy-name"
                        name="pharmacyName"
                        label="Pharmacy name"
                        value={pharmacyName}
                        error={!pharmacyNameIsValid ? 'Pharmacy name is required.' : undefined}
                        isTouched={!pharmacyNameIsValid && pharmacyFormIsDirty}
                        disabled={isProfileReadonly}
                        maxLength={USER_NAME_MAX_LENGTH}
                        onChange={(event) => handlePharmacyNameChange(sanitizeName(event.target.value))}
                      />

                      <EmailInput
                        id="pharmacy-email"
                        name="email"
                        value={pharmacyValues.email}
                        error={pharmacyErrors.email}
                        isTouched={Boolean(pharmacyTouched.email)}
                        disabled={isProfileReadonly}
                        maxLength={USER_EMAIL_MAX_LENGTH}
                        onChange={(event) => handlePharmacyChange('email', sanitizeEmail(event.target.value))}
                      />

                      <PhoneInput
                        id="pharmacy-phone"
                        name="phone"
                        value={pharmacyValues.phone}
                        error={pharmacyErrors.phone}
                        isTouched={Boolean(pharmacyTouched.phone)}
                        disabled={isProfileReadonly}
                        maxLength={USER_PHONE_MAX_LENGTH}
                        onChange={(event) => handlePharmacyChange('phone', sanitizePhone(event.target.value))}
                      />

                      <AddressInput
                        id="pharmacy-address"
                        name="address"
                        className={css.fieldWide}
                        value={pharmacyValues.address}
                        error={pharmacyErrors.address}
                        isTouched={Boolean(pharmacyTouched.address)}
                        disabled={isProfileReadonly}
                        maxLength={USER_ADDRESS_MAX_LENGTH}
                        onChange={(event) => handlePharmacyChange('address', sanitizeAddress(event.target.value))}
                      />

                      <div className={css.fieldWide}>
                        <WorkingHoursInput
                          id="pharmacy-working-hours"
                          name="workingHours"
                          value={pharmacyValues.workingHours}
                          error={pharmacyErrors.workingHours}
                          isTouched={Boolean(pharmacyTouched.workingHours)}
                          maxLength={WORKING_HOURS_MAX_LENGTH}
                          disabled={isProfileReadonly}
                          onChange={(event) => handlePharmacyChange('workingHours', sanitizeWorkingHours(event.target.value))}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      disabled={!pharmacyNameIsValid || hasValidationErrors(pharmacyErrors) || !pharmacyFormIsDirty || isPharmacySaving || isProfileReadonly}
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
                        Add the public pharmacy description clients will read after verification.
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
                      disabled={isProfileReadonly}
                      onChange={(event) => handleAboutChange(sanitizeTextEditor(event.target.value))}
                    />

                    <Button
                      type="button"
                      disabled={hasValidationErrors(aboutErrors) || !aboutFormIsDirty || isPharmacySaving || isProfileReadonly}
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
                        disabled={isProfileReadonly}
                        maxLength={USER_NAME_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('recipientName', sanitizeName(event.target.value))}
                      />

                      <TaxIdInput
                        id="tax-id"
                        name="taxId"
                        value={paymentValues.taxId}
                        error={paymentErrors.taxId}
                        isTouched={Boolean(paymentTouched.taxId)}
                        disabled={isProfileReadonly}
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
                        disabled={isProfileReadonly}
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
                        disabled={isProfileReadonly}
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
                        disabled={isProfileReadonly}
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
                        disabled={isProfileReadonly}
                        maxLength={PAYMENT_PURPOSE_MAX_LENGTH}
                        onChange={(event) => handlePaymentChange('paymentPurpose', sanitizePaymentPurpose(event.target.value))}
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={hasValidationErrors(paymentErrors) || !paymentFormIsDirty || isPharmacySaving || isProfileReadonly}
                      isLoading={isPharmacySaving}
                      loadingLabel="Saving..."
                      onClick={handlePaymentSubmit}
                    >
                      Save payment details
                    </Button>
                  </section>
                </div>
              ) : null}

              {activeTab === 'documents' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section className={css.panelSection} aria-labelledby="documents-title">
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="documents-title">
                        Registration documents
                      </h2>
                      <p className={css.panelText}>
                        Documents attached during pharmacy registration are shown here without demo files.
                      </p>
                    </div>

                    {pharmacy.documents.length > 0 ? (
                      <ul className={css.documentsList}>
                        {pharmacy.documents.map((document) => (
                          <li className={css.documentCard} key={`${document.name}-${document.size}`}>
                            <FileText size={22} aria-hidden="true" />
                            <div className={css.documentInfo}>
                              <strong>{document.name}</strong>
                              <span>{[document.type, formatFileSize(document.size)].filter(Boolean).join(' · ')}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className={css.emptyState}>
                        <h3>No documents found</h3>
                        <p>
                          The backend did not return registration documents for this pharmacy. Add documents during registration so Admin can verify the profile.
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              ) : null}

              {activeTab === 'reviews' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <ReviewsList
                    reviews={[]}
                    initialVisibleCount={INITIAL_VISIBLE_REVIEWS_COUNT}
                    emptyTitle="This pharmacy has no reviews yet."
                    emptyText="Reviews appear only after real client orders are completed and approved."
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
                        Review real devices signed in to your pharmacy account.
                      </p>
                    </div>

                    {isLoadingSessions ? (
                      <LoadingSpinner label="Loading active sessions..." />
                    ) : sessions.length > 0 ? (
                      <ul className={css.sessionsList}>
                        {sessions.map((session) => (
                          <li className={css.sessionCard} key={session.id}>
                            <MonitorSmartphone size={22} aria-hidden="true" />
                            <div className={css.sessionInfo}>
                              <strong>{session.deviceName ?? session.userAgent ?? 'Unknown device'}</strong>
                              <span>Last used: {formatSessionDate(session.lastUsedAt)}</span>
                            </div>
                            {session.isCurrent ? (
                              <span className={css.currentSession}>Current session</span>
                            ) : (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                isLoading={revokingSessionId === session.id}
                                loadingLabel="Revoking..."
                                onClick={() => void handleRevokeSession(session.id)}
                              >
                                Revoke
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className={css.emptyState}>
                        <h3>No active sessions found</h3>
                        <p>Session data will appear here when the backend returns active login devices.</p>
                      </div>
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
