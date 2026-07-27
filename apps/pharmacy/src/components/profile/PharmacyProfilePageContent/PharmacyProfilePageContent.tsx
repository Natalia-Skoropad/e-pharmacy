'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { KeyRound, MonitorSmartphone } from 'lucide-react';

import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import {
  Button,
  LazyLoadButton,
  LoadingSpinner,
} from '@e-pharmacy/ui/primitives';

import { DocumentUpload, MarkdownTextarea } from '@e-pharmacy/ui/forms';
import { PictureCard } from '@e-pharmacy/ui/media';
import { WorkingHoursInput } from '../WorkingHoursInput';
import { ReviewsList } from '@e-pharmacy/ui/data-display';
import { Tabs } from '@e-pharmacy/ui/navigation';
import { Container } from '@e-pharmacy/ui/layout';
import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';

import {
  AddressInput,
  CommentInput,
  EmailInput,
  IbanInput,
  NameInput,
  PasswordInput,
  PhoneInput,
  TaxIdInput,
} from '@e-pharmacy/ui/forms';

import { useToast } from '@e-pharmacy/ui/feedback';
import { PageLoader } from '@e-pharmacy/ui/status-pages';
import { useAuth } from '@e-pharmacy/auth/core';
import { formatDateTime } from '@e-pharmacy/utils/date';
import type { ActiveSession } from '@e-pharmacy/types/auth';

import type {
  PharmacyProfile,
  PharmacyStatus,
  UpdateMyPharmacyProfilePayload,
} from '@e-pharmacy/types/pharmacies';

import {
  CHANGE_PASSWORD_FORM_FIELDS,
  CHANGE_PASSWORD_INITIAL_VALUES,
  DATA_PROFILE_FORM_FIELDS,
  USER_ADDRESS_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  hasValidationErrors,
  isChangePasswordFormDirty,
  isChangePasswordFormValid,
  isDataProfileFormDirty,
  isDataProfileFormValid,
  markAllFieldsTouched,
  normalizePhoneInput,
  validateChangePasswordForm,
  validateDataProfileForm,
  type ChangePasswordFormValues,
  type ChangePasswordTouchedFields,
  type DataProfileFormValues,
  type DataProfileTouchedFields,
} from '@e-pharmacy/validation/profile';

import {
  PHARMACY_ABOUT_FORM_FIELDS,
  PHARMACY_PAYMENT_FORM_FIELDS,
  PHARMACY_CONTACT_FORM_FIELDS,
  PAYMENT_PURPOSE_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  PHARMACY_NAME_MAX_LENGTH,
  BANK_RECIPIENT_NAME_MAX_LENGTH,
  BANK_NAME_MAX_LENGTH,
  TEXT_EDITOR_MAX_LENGTH,
  TAX_ID_MAX_LENGTH,
  IBAN_MAX_LENGTH,
  isPharmacyAboutFormDirty,
  isPharmacyContactFormDirty,
  isPharmacyPaymentFormDirty,
  normalizePharmacyAboutForm,
  normalizePharmacyContactForm,
  normalizePharmacyPaymentForm,
  normalizeEmail,
  normalizeIban,
  sanitizeTaxId,
  validatePharmacyAboutForm,
  validatePharmacyContactForm,
  validatePharmacyPaymentForm,
  type PharmacyAboutFormValues,
  type PharmacyAboutTouchedFields,
  type PharmacyContactFormValues,
  type PharmacyContactTouchedFields,
  type PharmacyPaymentFormValues,
  type PharmacyPaymentTouchedFields,
  type PharmacyValidationMode,
} from '@e-pharmacy/validation/pharmacy';

import {
  PICTURE_ACCEPT,
  PHARMACY_DOCUMENT_ACCEPT,
  PHARMACY_DOCUMENT_RULES,
  buildPictureFileError,
  buildPictureUrlError,
  normalizePharmacyDocument,
  validatePharmacyDocuments,
} from '@e-pharmacy/validation/files';

import {
  createPharmacyNote,
  deletePharmacyNote,
  getActiveSessions,
  getPharmacyNotes,
  revokeActiveSession,
  sendMyPharmacyForVerification,
  updateCurrentUser,
  updateCurrentUserPassword,
  updateMyPharmacyProfile,
} from '@/lib/api/browser';

import {
  StatusBadge,
  StatusBanner,
} from '@e-pharmacy/ui/statistics';

import { EntityComments } from '@/components/comments/EntityComments';

import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

import css from './PharmacyProfilePageContent.module.css';

//===================================================================

type AuthUser = NonNullable<ReturnType<typeof useAuth>['user']>;

type ProfileUserDefaults = Pick<AuthUser, 'email' | 'name' | 'phone'>;

//===================================================================

type ProfileTab =
  | 'data'
  | 'pharmacy-data'
  | 'about'
  | 'payment'
  | 'documents'
  | 'reviews'
  | 'comments'
  | 'sessions';

type PendingModerationItem = {
  label: string;
  value?: string | null;
};

//===================================================================

const INITIAL_VISIBLE_REVIEWS_COUNT = 10;
const INITIAL_VISIBLE_SESSIONS_COUNT = 10;

//===================================================================

const TABS: Array<{ value: ProfileTab; label: string }> = [
  { value: 'data', label: 'My data' },
  { value: 'pharmacy-data', label: 'Pharmacy data' },
  { value: 'about', label: 'About pharmacy' },
  { value: 'payment', label: 'Payment details' },
  { value: 'documents', label: 'Documents' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'comments', label: 'Comments' },
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

//===================================================================

function createPharmacyInitialValues(
  user: ProfileUserDefaults,
  pharmacy: PharmacyProfile
): PharmacyContactFormValues {
  return {
    name: createPharmacyNameInitialValue(user, pharmacy),
    address: pharmacy.address ?? '',
    phone: pharmacy.phone ?? user.phone ?? '',
    email: pharmacy.email ?? user.email ?? '',
    workingHours: pharmacy.workingHours ?? '',
  };
}

//===================================================================

function createAboutInitialValues(
  pharmacy: PharmacyProfile
): PharmacyAboutFormValues {
  return {
    description: pharmacy.description ?? '',
  };
}

//===================================================================

function createPaymentInitialValues(
  user: ProfileUserDefaults,
  pharmacy: PharmacyProfile
): PharmacyPaymentFormValues {
  const recipientName = pharmacy.bankDetails?.recipientName?.trim() ?? '';
  const ownerName = user.name?.trim() ?? '';
  const shouldClearOwnerNameFallback =
    pharmacy.status === 'new' && recipientName === ownerName;

  return {
    recipientName: shouldClearOwnerNameFallback ? '' : recipientName,
    taxId: pharmacy.bankDetails?.taxId ?? '',
    iban: pharmacy.bankDetails?.iban ?? '',
    bankName: pharmacy.bankDetails?.bankName ?? '',
    receiptEmail:
      pharmacy.bankDetails?.receiptEmail ?? pharmacy.email ?? user.email ?? '',
    paymentPurpose: pharmacy.bankDetails?.paymentPurpose ?? '',
  };
}

//===================================================================

function createPharmacyNameInitialValue(
  user: ProfileUserDefaults,
  pharmacy: PharmacyProfile
): string {
  const pharmacyName = pharmacy.name?.trim() ?? '';
  const ownerName = user.name?.trim() ?? '';
  const looksLikeRegistrationFallback =
    pharmacy.status === 'new' && pharmacyName === ownerName;

  return looksLikeRegistrationFallback ? '' : pharmacyName;
}

//===================================================================

function createDocumentId(
  document: PharmacyProfile['documents'][number],
  index: number
): string {
  return `${document.name}-${document.size}-${document.type ?? ''}-${index}`;
}

//===================================================================

function createDocumentValues(
  documents: PharmacyProfile['documents']
): BrowserUploadFile[] {
  return documents.map((document, index) => ({
    id: createDocumentId(document, index),
    name: document.name,
    size: document.size,
    type: document.type ?? '',
  }));
}

//===================================================================

function normalizeDocumentValues(files: BrowserUploadFile[]) {
  return files.map(normalizePharmacyDocument);
}

//===================================================================

function areDocumentValuesEqual(
  first: BrowserUploadFile[],
  second: BrowserUploadFile[]
): boolean {
  return (
    JSON.stringify(normalizeDocumentValues(first)) ===
    JSON.stringify(normalizeDocumentValues(second))
  );
}

//===================================================================

function createTouchedUpdater<TValues extends object>(
  setTouched: Dispatch<SetStateAction<Partial<Record<keyof TValues, boolean>>>>,
  field: keyof TValues
) {
  setTouched((current) => ({ ...current, [field]: true }));
}

//===================================================================

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}



//===================================================================

function isReadonlyStatus(status: PharmacyStatus): boolean {
  return status === 'on_verification' || status === 'on_moderation';
}

//===================================================================

function getStatusNoteClassName(status: PharmacyStatus): string {
  if (status === 'on_verification') {
    return `${css.statusNote} ${css.statusNoteBeauty}`;
  }

  if (status === 'active') {
    return `${css.statusNote} ${css.statusNoteActive}`;
  }

  if (status === 'on_moderation') {
    return `${css.statusNote} ${css.statusNoteWarning}`;
  }

  return css.statusNote;
}

//===================================================================

function formatPendingModerationValue(value?: string | null): string {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || 'Not provided';
}

//===================================================================

function PendingModerationBox({
  title,
  items,
}: Readonly<{
  title: string;
  items: PendingModerationItem[];
}>) {
  const visibleItems = items.filter((item) => item.value !== undefined);

  if (visibleItems.length === 0) return null;

  return (
    <section className={css.pendingBox} aria-label={title}>
      <div className={css.pendingHeader}>
        <h3>{title}</h3>
        <StatusBadge {...PHARMACY_STATUS_PRESENTATION.on_moderation} />
      </div>
      <dl className={css.pendingList}>
        {visibleItems.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{formatPendingModerationValue(item.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

//===================================================================

function formatSessionDate(value: string): string {
  return formatDateTime(value) ?? 'Unknown';
}

//===================================================================

function buildProfilePayload(
  values: PharmacyContactFormValues,
  mode: PharmacyValidationMode
): UpdateMyPharmacyProfilePayload {
  return normalizePharmacyContactForm(values, mode);
}

//===================================================================

function buildAboutPayload(
  values: PharmacyAboutFormValues,
  mode: PharmacyValidationMode
): UpdateMyPharmacyProfilePayload {
  return normalizePharmacyAboutForm(values, mode);
}

//===================================================================

function buildPaymentPayload(
  values: PharmacyPaymentFormValues,
  mode: PharmacyValidationMode
): UpdateMyPharmacyProfilePayload {
  const bankDetails = normalizePharmacyPaymentForm(values, mode);

  return Object.keys(bankDetails).length > 0 ? { bankDetails } : {};
}

//===================================================================

function buildDocumentsPayload(
  files: BrowserUploadFile[]
): UpdateMyPharmacyProfilePayload {
  return {
    documents: normalizeDocumentValues(files),
  };
}

//===================================================================

function hasProfilePayloadChanges(
  payload: UpdateMyPharmacyProfilePayload
): boolean {
  return Object.keys(payload).length > 0;
}

//===================================================================

function PharmacyProfilePageContent() {
  const { user, isAuthReady } = useAuth();
  const {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
    syncProfile,
  } = usePharmacyProfile();

  if (!isAuthReady || !user || isProfileLoading) {
    return <PageLoader label="Loading pharmacy profile..." />;
  }

  if (!profile) {
    return (
      <main className={css.page}>
        <section
          className={css.section}
          aria-labelledby="pharmacy-profile-title"
        >
          <Container className={css.profileContainer}>
            <StatusBanner tone="danger" label="Error"
              title="Pharmacy profile could not be loaded"
              message={
                profileError
                  ? getErrorMessage(
                      profileError,
                      'Could not load pharmacy profile.'
                    )
                  : 'Please refresh the page and try again.'
              }
            />
          </Container>
        </section>
      </main>
    );
  }

  return (
    <PharmacyProfilePage
      key={user.id ?? user.email}
      user={user}
      initialPharmacy={profile}
      initialLoadError={
        profileError
          ? getErrorMessage(profileError, 'Could not load pharmacy profile.')
          : null
      }
      syncProfile={syncProfile}
    />
  );
}

//===================================================================

type PharmacyProfilePageProps = Readonly<{
  user: AuthUser;
  initialPharmacy: PharmacyProfile;
  initialLoadError: string | null;
  syncProfile: (profile: PharmacyProfile) => void;
}>;

//===================================================================

function PharmacyProfilePage({
  user,
  initialPharmacy,
  initialLoadError,
  syncProfile,
}: PharmacyProfilePageProps) {
  const toast = useToast();
  const { reloadCurrentUser } = useAuth();

  const profileUserDefaults = useMemo<ProfileUserDefaults>(
    () => ({
      email: user.email,
      name: user.name,
      phone: user.phone,
    }),
    [user.email, user.name, user.phone]
  );

  const [activeTab, setActiveTab] = useState<ProfileTab>('data');
  const [pharmacy, setPharmacy] = useState<PharmacyProfile | null>(
    initialPharmacy
  );
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [visibleSessionsCount, setVisibleSessionsCount] = useState(
    INITIAL_VISIBLE_SESSIONS_COUNT
  );
  const [isLoadingProfile] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [loadError] = useState<string | null>(initialLoadError);

  const [ownerValues, setOwnerValues] = useState<DataProfileFormValues>(() =>
    createOwnerInitialValues(user)
  );
  const [initialOwnerValues, setInitialOwnerValues] =
    useState<DataProfileFormValues>(() => createOwnerInitialValues(user));
  const [ownerTouched, setOwnerTouched] = useState<DataProfileTouchedFields>(
    {}
  );

  const [passwordValues, setPasswordValues] =
    useState<ChangePasswordFormValues>(CHANGE_PASSWORD_INITIAL_VALUES);

  const [passwordTouched, setPasswordTouched] =
    useState<ChangePasswordTouchedFields>({});

  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);

  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);

  const [ownerPictureUrl, setOwnerPictureUrl] = useState<string | null>(
    user.pictureUrl ?? null
  );
  const [pharmacyPictureUrl, setPharmacyPictureUrl] = useState<string | null>(
    initialPharmacy?.imageUrl ?? null
  );
  const [initialPharmacyPictureUrl, setInitialPharmacyPictureUrl] = useState<
    string | null
  >(initialPharmacy?.imageUrl ?? null);

  const [pharmacyValues, setPharmacyValues] =
    useState<PharmacyContactFormValues>(() =>
      createPharmacyInitialValues(profileUserDefaults, initialPharmacy)
    );

  const [initialPharmacyValues, setInitialPharmacyValues] =
    useState<PharmacyContactFormValues>(() =>
      createPharmacyInitialValues(profileUserDefaults, initialPharmacy)
    );
  const [pharmacyTouched, setPharmacyTouched] =
    useState<PharmacyContactTouchedFields>({});

  const [aboutValues, setAboutValues] = useState<PharmacyAboutFormValues>(
    () => createAboutInitialValues(initialPharmacy)
  );

  const [initialAboutValues, setInitialAboutValues] =
    useState<PharmacyAboutFormValues>(() =>
      createAboutInitialValues(initialPharmacy)
    );
  const [aboutTouched, setAboutTouched] = useState<PharmacyAboutTouchedFields>(
    {}
  );

  const [paymentValues, setPaymentValues] = useState<PharmacyPaymentFormValues>(
    () => createPaymentInitialValues(profileUserDefaults, initialPharmacy)
  );
  const [initialPaymentValues, setInitialPaymentValues] =
    useState<PharmacyPaymentFormValues>(() =>
      createPaymentInitialValues(profileUserDefaults, initialPharmacy)
    );
  const [paymentTouched, setPaymentTouched] =
    useState<PharmacyPaymentTouchedFields>({});

  const [documentValues, setDocumentValues] = useState<BrowserUploadFile[]>(
    () => createDocumentValues(initialPharmacy.documents)
  );
  const [initialDocumentValues, setInitialDocumentValues] = useState<
    BrowserUploadFile[]
  >(() => createDocumentValues(initialPharmacy.documents));
  const [documentsTouched, setDocumentsTouched] = useState(false);
  const [documentsError, setDocumentsError] = useState('');

  const [isOwnerSaving, setIsOwnerSaving] = useState(false);
  const [isOwnerPictureSaving, setIsOwnerPictureSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isPharmacyPictureSaving, setIsPharmacyPictureSaving] = useState(false);
  const [isPharmacySaving, setIsPharmacySaving] = useState(false);
  const [isDocumentsSaving, setIsDocumentsSaving] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!pharmacy?.id) return;

    const controller = new AbortController();
    const pharmacyId = pharmacy.id;

    async function loadCommentsTotal() {
      try {
        const response = await getPharmacyNotes('pharmacy', pharmacyId, 1, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) setCommentsTotal(response.total);
      } catch {
        if (!controller.signal.aborted) setCommentsTotal(0);
      }
    }

    void loadCommentsTotal();

    return () => {
      controller.abort();
    };
  }, [pharmacy?.id]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSessions() {
      setIsLoadingSessions(true);

      try {
        const response = await getActiveSessions({
          signal: controller.signal,
        });

        if (!controller.signal.aborted) setSessions([...response.sessions]);
      } catch {
        if (!controller.signal.aborted) setSessions([]);
      } finally {
        if (!controller.signal.aborted) setIsLoadingSessions(false);
      }
    }

    void loadSessions();

    return () => {
      controller.abort();
    };
  }, []);

  const ownerErrors = useMemo(
    () => validateDataProfileForm(ownerValues),
    [ownerValues]
  );
  const passwordErrors = useMemo(
    () => validateChangePasswordForm(passwordValues),
    [passwordValues]
  );
  const pharmacyStatus = pharmacy?.status ?? 'new';
  const pharmacyValidationMode: PharmacyValidationMode =
    pharmacyStatus === 'new' ? 'draft' : 'verification';

  const pharmacyErrors = useMemo(
    () => validatePharmacyContactForm(pharmacyValues, pharmacyValidationMode),
    [pharmacyValidationMode, pharmacyValues]
  );
  const pharmacyVerificationErrors = useMemo(
    () => validatePharmacyContactForm(pharmacyValues, 'verification'),
    [pharmacyValues]
  );
  const aboutErrors = useMemo(
    () => validatePharmacyAboutForm(aboutValues, pharmacyValidationMode),
    [aboutValues, pharmacyValidationMode]
  );
  const aboutVerificationErrors = useMemo(
    () => validatePharmacyAboutForm(aboutValues, 'verification'),
    [aboutValues]
  );
  const paymentErrors = useMemo(
    () => validatePharmacyPaymentForm(paymentValues, pharmacyValidationMode),
    [paymentValues, pharmacyValidationMode]
  );
  const paymentVerificationErrors = useMemo(
    () => validatePharmacyPaymentForm(paymentValues, 'verification'),
    [paymentValues]
  );

  const ownerFormIsDirty = isDataProfileFormDirty(
    ownerValues,
    initialOwnerValues
  );
  const ownerFormIsValid = isDataProfileFormValid(ownerValues);
  const passwordFormIsDirty = isChangePasswordFormDirty(passwordValues);
  const passwordFormIsValid = isChangePasswordFormValid(passwordValues);

  const pharmacyFormIsDirty = isPharmacyContactFormDirty(
    pharmacyValues,
    initialPharmacyValues
  );

  const aboutFormIsDirty = isPharmacyAboutFormDirty(
    aboutValues,
    initialAboutValues
  );

  const paymentFormIsDirty = isPharmacyPaymentFormDirty(
    paymentValues,
    initialPaymentValues
  );

  const documentsFormIsDirty = !areDocumentValuesEqual(
    documentValues,
    initialDocumentValues
  );

  const pharmacyPictureIsDirty =
    (pharmacyPictureUrl ?? '') !== (initialPharmacyPictureUrl ?? '');

  const isProfileReadonly = isReadonlyStatus(pharmacyStatus);
  const pharmacyDocumentsError = validatePharmacyDocuments(documentValues, {
    required: true,
  });
  const pharmacyDocumentsAreReady =
    !pharmacyDocumentsError && !documentsFormIsDirty;

  const pharmacyPictureIsReady = Boolean(pharmacyPictureUrl);

  const canSendForVerification =
    Boolean(pharmacy) &&
    pharmacyStatus === 'new' &&
    pharmacyDocumentsAreReady &&
    pharmacyPictureIsReady &&
    !hasValidationErrors(pharmacyVerificationErrors) &&
    !hasValidationErrors(aboutVerificationErrors) &&
    !hasValidationErrors(paymentVerificationErrors) &&
    !pharmacyFormIsDirty &&
    !aboutFormIsDirty &&
    !paymentFormIsDirty &&
    !documentsFormIsDirty &&
    !isPharmacySaving &&
    !isPharmacyPictureSaving &&
    !isDocumentsSaving &&
    !isSendingVerification;

  const moderationFormHasChanges =
    pharmacyFormIsDirty ||
    aboutFormIsDirty ||
    paymentFormIsDirty ||
    documentsFormIsDirty ||
    pharmacyPictureIsDirty;

  const moderationFormIsValid =
    pharmacyPictureIsReady &&
    !hasValidationErrors(pharmacyVerificationErrors) &&
    !hasValidationErrors(aboutVerificationErrors) &&
    !hasValidationErrors(paymentVerificationErrors) &&
    !pharmacyDocumentsError;

  const canSendForModeration =
    Boolean(pharmacy) &&
    pharmacyStatus === 'active' &&
    moderationFormHasChanges &&
    moderationFormIsValid &&
    !isPharmacySaving &&
    !isPharmacyPictureSaving &&
    !isDocumentsSaving &&
    !isSendingVerification;

  const reviewsCount = pharmacy?.reviewsCount ?? 0;
  const documentsCount = documentValues.length;

  const tabs = TABS.map((tab) => {
    if (tab.value === 'reviews') {
      return { ...tab, label: `Reviews (${reviewsCount})` };
    }

    if (tab.value === 'documents') {
      return { ...tab, label: `Documents (${documentsCount})` };
    }

    if (tab.value === 'comments') {
      return { ...tab, label: `Comments (${commentsTotal})` };
    }

    return tab;
  });

  const visibleSessions = sessions.slice(0, visibleSessionsCount);

  const handleOwnerChange = (
    field: keyof DataProfileFormValues,
    value: string
  ) => {
    createTouchedUpdater(setOwnerTouched, field);
    setOwnerValues((current) => ({ ...current, [field]: value }));
  };

  const handlePasswordChange = (
    field: keyof ChangePasswordFormValues,
    value: string
  ) => {
    createTouchedUpdater(setPasswordTouched, field);
    setPasswordValues((current) => ({ ...current, [field]: value }));
  };

  const handlePharmacyChange = (
    field: keyof PharmacyContactFormValues,
    value: string
  ) => {
    createTouchedUpdater(setPharmacyTouched, field);
    setPharmacyValues((current) => ({ ...current, [field]: value }));
  };

  const handleAboutChange = (value: string) => {
    setAboutTouched((current) => ({ ...current, description: true }));
    setAboutValues({ description: value });
  };

  const handlePaymentChange = (
    field: keyof PharmacyPaymentFormValues,
    value: string
  ) => {
    createTouchedUpdater(setPaymentTouched, field);
    setPaymentValues((current) => ({ ...current, [field]: value }));
  };

  const handlePictureError = (message: string) => toast.error(message);

  const handleOwnerPictureChange = async (nextPictureUrl: string | null) => {
    setIsOwnerPictureSaving(true);

    try {
      const response = await updateCurrentUser({
        pictureUrl: nextPictureUrl,
      });

      setOwnerPictureUrl(response.user.pictureUrl ?? null);
      await reloadCurrentUser();
      toast.success(
        nextPictureUrl
          ? 'Profile photo was updated.'
          : 'Profile photo was removed.'
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update profile photo.'));
    } finally {
      setIsOwnerPictureSaving(false);
    }
  };

  const handlePharmacyPictureChange = async (nextPictureUrl: string | null) => {
    if (!pharmacy || isProfileReadonly) return;

    if (pharmacy.status === 'active') {
      setPharmacyPictureUrl(nextPictureUrl);
      toast.success(
        nextPictureUrl
          ? 'Pharmacy photo is ready to send for moderation.'
          : 'Pharmacy photo removal is ready to send for moderation.'
      );
      return;
    }

    setIsPharmacyPictureSaving(true);

    try {
      const response = await updateMyPharmacyProfile({
        imageUrl: nextPictureUrl,
      });
      setPharmacy(response.pharmacy);
      syncProfile(response.pharmacy);
      setPharmacyPictureUrl(response.pharmacy.imageUrl ?? null);
      setInitialPharmacyPictureUrl(response.pharmacy.imageUrl ?? null);
      toast.success(
        nextPictureUrl
          ? 'Pharmacy photo was updated.'
          : 'Pharmacy photo was removed.'
      );
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
      });

      const nextValues = createOwnerInitialValues(response.user);
      setOwnerPictureUrl(response.user.pictureUrl ?? null);
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
      toast.success(
        'Password changed successfully. Please sign in again if the session was refreshed.'
      );
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
      hasValidationErrors(pharmacyErrors) ||
      !pharmacyFormIsDirty ||
      isProfileReadonly
    ) {
      return;
    }

    setIsPharmacySaving(true);

    try {
      const response = await updateMyPharmacyProfile(
        buildProfilePayload(pharmacyValues, pharmacyValidationMode)
      );
      const nextValues = createPharmacyInitialValues(user, response.pharmacy);
      setPharmacy(response.pharmacy);
      syncProfile(response.pharmacy);
      setPharmacyValues(nextValues);
      setInitialPharmacyValues(nextValues);
      setPharmacyTouched({});
      toast.success(
        response.pharmacy.status === 'on_moderation'
          ? 'Changes sent for moderation.'
          : 'Pharmacy data saved successfully.'
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save pharmacy data.'));
    } finally {
      setIsPharmacySaving(false);
    }
  };

  const handleAboutSubmit = async () => {
    setAboutTouched(markAllFieldsTouched(PHARMACY_ABOUT_FORM_FIELDS));

    if (
      !pharmacy ||
      hasValidationErrors(aboutErrors) ||
      !aboutFormIsDirty ||
      isProfileReadonly
    )
      return;

    setIsPharmacySaving(true);

    try {
      const response = await updateMyPharmacyProfile(
        buildAboutPayload(aboutValues, pharmacyValidationMode)
      );
      const nextValues = createAboutInitialValues(response.pharmacy);
      setPharmacy(response.pharmacy);
      syncProfile(response.pharmacy);
      setAboutValues(nextValues);
      setInitialAboutValues(nextValues);
      setAboutTouched({});
      toast.success(
        response.pharmacy.status === 'on_moderation'
          ? 'Changes sent for moderation.'
          : 'About pharmacy saved successfully.'
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save about pharmacy.'));
    } finally {
      setIsPharmacySaving(false);
    }
  };

  const handlePaymentSubmit = async () => {
    setPaymentTouched(markAllFieldsTouched(PHARMACY_PAYMENT_FORM_FIELDS));

    if (
      !pharmacy ||
      hasValidationErrors(paymentErrors) ||
      !paymentFormIsDirty ||
      isProfileReadonly
    )
      return;

    setIsPharmacySaving(true);

    try {
      const response = await updateMyPharmacyProfile(
        buildPaymentPayload(paymentValues, pharmacyValidationMode)
      );
      const nextValues = createPaymentInitialValues(user, response.pharmacy);
      setPharmacy(response.pharmacy);
      syncProfile(response.pharmacy);
      setPaymentValues(nextValues);
      setInitialPaymentValues(nextValues);
      setPaymentTouched({});
      toast.success(
        response.pharmacy.status === 'on_moderation'
          ? 'Changes sent for moderation.'
          : 'Payment details saved successfully.'
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save payment details.'));
    } finally {
      setIsPharmacySaving(false);
    }
  };

  const handleDocumentsChange = (files: BrowserUploadFile[]) => {
    setDocumentsTouched(true);

    const error = validatePharmacyDocuments(files);
    if (error) {
      setDocumentsError(error);
      return;
    }

    setDocumentValues(files);
    setDocumentsError('');
  };

  const handleDocumentsSubmit = async () => {
    setDocumentsTouched(true);

    const validationError = validatePharmacyDocuments(documentValues);
    setDocumentsError(validationError);

    if (
      !pharmacy ||
      validationError ||
      !documentsFormIsDirty ||
      isProfileReadonly
    )
      return;

    setIsDocumentsSaving(true);

    try {
      const response = await updateMyPharmacyProfile(
        buildDocumentsPayload(documentValues)
      );
      const nextDocumentValues = createDocumentValues(
        response.pharmacy.documents
      );

      setPharmacy(response.pharmacy);
      syncProfile(response.pharmacy);
      setDocumentValues(nextDocumentValues);
      setInitialDocumentValues(nextDocumentValues);
      setDocumentsTouched(false);
      setDocumentsError('');
      toast.success(
        response.pharmacy.status === 'on_moderation'
          ? 'Changes sent for moderation.'
          : 'Documents saved successfully.'
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save documents.'));
    } finally {
      setIsDocumentsSaving(false);
    }
  };

  const buildModerationPayload = (): UpdateMyPharmacyProfilePayload => {
    const payload: UpdateMyPharmacyProfilePayload = {};

    if (pharmacyFormIsDirty) {
      Object.assign(
        payload,
        buildProfilePayload(pharmacyValues, 'verification')
      );
    }

    if (pharmacyPictureIsDirty) {
      payload.imageUrl = pharmacyPictureUrl;
    }

    if (aboutFormIsDirty) {
      Object.assign(payload, buildAboutPayload(aboutValues, 'verification'));
    }

    if (paymentFormIsDirty) {
      Object.assign(
        payload,
        buildPaymentPayload(paymentValues, 'verification')
      );
    }

    if (documentsFormIsDirty) {
      Object.assign(payload, buildDocumentsPayload(documentValues));
    }

    return payload;
  };

  const applyPharmacyFormState = (nextPharmacy: PharmacyProfile) => {
    const nextPharmacyValues = createPharmacyInitialValues(user, nextPharmacy);
    const nextAboutValues = createAboutInitialValues(nextPharmacy);
    const nextPaymentValues = createPaymentInitialValues(user, nextPharmacy);
    const nextDocumentValues = createDocumentValues(nextPharmacy.documents);

    setPharmacy(nextPharmacy);
    syncProfile(nextPharmacy);
    setPharmacyPictureUrl(nextPharmacy.imageUrl ?? null);
    setInitialPharmacyPictureUrl(nextPharmacy.imageUrl ?? null);
    setPharmacyValues(nextPharmacyValues);
    setInitialPharmacyValues(nextPharmacyValues);
    setAboutValues(nextAboutValues);
    setInitialAboutValues(nextAboutValues);
    setPaymentValues(nextPaymentValues);
    setInitialPaymentValues(nextPaymentValues);
    setDocumentValues(nextDocumentValues);
    setInitialDocumentValues(nextDocumentValues);
    setPharmacyTouched({});
    setAboutTouched({});
    setPaymentTouched({});
    setDocumentsTouched(false);
    setDocumentsError('');
  };

  const handleSendForModeration = async () => {
    setPharmacyTouched(markAllFieldsTouched(PHARMACY_CONTACT_FORM_FIELDS));
    setAboutTouched(markAllFieldsTouched(PHARMACY_ABOUT_FORM_FIELDS));
    setPaymentTouched(markAllFieldsTouched(PHARMACY_PAYMENT_FORM_FIELDS));
    setDocumentsTouched(true);

    if (!canSendForModeration) return;

    const payload = buildModerationPayload();

    if (!hasProfilePayloadChanges(payload)) return;

    setIsSendingVerification(true);

    try {
      await updateMyPharmacyProfile(payload);
      const response = await sendMyPharmacyForVerification();
      applyPharmacyFormState(response.pharmacy);
      toast.success(response.message);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          'Could not send pharmacy changes for moderation.'
        )
      );
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleSendForVerification = async () => {
    setPharmacyTouched(markAllFieldsTouched(PHARMACY_CONTACT_FORM_FIELDS));
    setAboutTouched(markAllFieldsTouched(PHARMACY_ABOUT_FORM_FIELDS));
    setPaymentTouched(markAllFieldsTouched(PHARMACY_PAYMENT_FORM_FIELDS));
    setDocumentsTouched(true);

    if (!canSendForVerification) return;

    setIsSendingVerification(true);

    try {
      const response = await sendMyPharmacyForVerification();
      setPharmacy(response.pharmacy);
      syncProfile(response.pharmacy);
      toast.success(response.message);
    } catch (error) {
      toast.error(
        getErrorMessage(error, 'Could not send pharmacy for verification.')
      );
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);

    try {
      await revokeActiveSession(sessionId);
      setSessions((current) =>
        current.filter((session) => session.id !== sessionId)
      );
      toast.success('Session was revoked.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not revoke session.'));
    } finally {
      setRevokingSessionId(null);
    }
  };

  if (isLoadingProfile) {
    return (
      <main className={css.page}>
        <section className={css.section} aria-label="Loading pharmacy profile">
          <Container className={css.profileContainer}>
            <div className={css.loaderBox}>
              <LoadingSpinner label="Loading pharmacy profile..." />
            </div>
          </Container>
        </section>
      </main>
    );
  }

  if (loadError || !pharmacy) {
    return (
      <main className={css.page}>
        <section
          className={css.section}
          aria-labelledby="pharmacy-profile-title"
        >
          <Container className={css.profileContainer}>
            <StatusBanner tone="danger" label="Error"
              title="Pharmacy profile could not be loaded"
              message={loadError ?? 'Please refresh the page and try again.'}
            />
          </Container>
        </section>
      </main>
    );
  }

  const summaryOwnerName = ownerValues.name || user.name || 'Pharmacy owner';

  const summaryPharmacyName =
    pharmacyValues.name || pharmacy.name || 'Pharmacy profile';

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="pharmacy-profile-title">
        <Container className={css.profileContainer}>
          <div className={css.profileShell}>
            <aside
              className={css.sidebar}
              aria-label="Pharmacy profile summary"
            >
              <PictureCard
                name={summaryOwnerName}
                pictureUrl={ownerPictureUrl}
                isSaving={isOwnerPictureSaving}
                accept={PICTURE_ACCEPT}
                validateFile={(file) => buildPictureFileError(file) || null}
                validatePictureUrl={(nextPictureUrl) =>
                  buildPictureUrlError(nextPictureUrl) || null
                }
                onChange={handleOwnerPictureChange}
                onError={handlePictureError}
              />

              <div className={css.nameBlock}>
                <p className={css.name}>{summaryOwnerName}</p>
                <p className={css.email}>{user.email}</p>
              </div>

              <dl className={css.compactDetails}>
                <div>
                  <dt>Role</dt>
                  <dd>Pharmacy</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{PHARMACY_STATUS_PRESENTATION[pharmacy.status].label}</dd>
                </div>
              </dl>

              <div className={getStatusNoteClassName(pharmacy.status)}>
                <div className={css.statusNoteHeader}>
                  <h3>Profile status</h3>
                  <StatusBadge {...PHARMACY_STATUS_PRESENTATION[pharmacy.status]} />
                </div>
                {pharmacy.status === 'new' && pharmacy.statusReason ? (
                  <p className={css.statusReason}>{pharmacy.statusReason}</p>
                ) : null}
                {pharmacy.status === 'new' && !pharmacy.statusReason ? (
                  <p>
                    New pharmacies can edit registration data and complete
                    required fields. Sales, orders, own products, clients, and
                    product requests unlock after verification.
                  </p>
                ) : null}
                {pharmacy.status === 'on_verification' ? (
                  <p>
                    The profile is waiting for Admin verification. Submitted
                    fields are read-only until the decision is made.
                  </p>
                ) : null}
                {pharmacy.status === 'on_moderation' ? (
                  <p>
                    Profile changes are on moderation. Approved public data
                    remains visible until Admin reviews the changes.
                  </p>
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

              {pharmacy.status === 'active' ? (
                <Button
                  type="button"
                  fullWidth
                  disabled={!canSendForModeration}
                  isLoading={isSendingVerification}
                  loadingLabel="Sending..."
                  onClick={handleSendForModeration}
                >
                  Send for moderation
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
                  <section
                    className={css.panelSection}
                    aria-labelledby="owner-data-title"
                  >
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="owner-data-title">
                        Owner data
                      </h2>
                      <p className={css.panelText}>
                        These are the real details used when the pharmacy owner
                        registered.
                      </p>
                    </div>
                    <div className={css.formGrid}>
                      <NameInput
                        id="owner-name"
                        name="name"
                        value={ownerValues.name}
                        error={ownerErrors.name}
                        isTouched={Boolean(ownerTouched.name)}
                        maxLength={USER_NAME_MAX_LENGTH}
                        onChange={(event) =>
                          handleOwnerChange('name', event.target.value)
                        }
                      />

                      <PhoneInput
                        id="owner-phone"
                        name="phone"
                        value={ownerValues.phone}
                        error={ownerErrors.phone}
                        isTouched={Boolean(ownerTouched.phone)}
                        maxLength={USER_PHONE_MAX_LENGTH}
                        onChange={(event) =>
                          handleOwnerChange(
                            'phone',
                            normalizePhoneInput(event.target.value)
                          )
                        }
                      />
                    </div>

                    <Button
                      className={css.myDataAction}
                      type="button"
                      disabled={
                        !ownerFormIsValid || !ownerFormIsDirty || isOwnerSaving
                      }
                      isLoading={isOwnerSaving}
                      loadingLabel="Saving..."
                      onClick={handleOwnerSubmit}
                    >
                      Save owner data
                    </Button>
                  </section>

                  <section
                    className={css.panelSection}
                    aria-labelledby="password-title"
                  >
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="password-title">
                        Change password
                      </h2>
                      <p className={css.panelText}>
                        Use this section only when you want to update the owner
                        login password.
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
                        onToggleVisibility={() =>
                          setIsCurrentPasswordVisible((value) => !value)
                        }
                        onChange={(event) =>
                          handlePasswordChange(
                            'currentPassword',
                            event.target.value
                          )
                        }
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
                        onToggleVisibility={() =>
                          setIsNewPasswordVisible((value) => !value)
                        }
                        onChange={(event) =>
                          handlePasswordChange(
                            'newPassword',
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <Button
                      className={css.myDataAction}
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
                  <section
                    className={css.panelSection}
                    aria-labelledby="pharmacy-data-title"
                  >
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="pharmacy-data-title">
                        Pharmacy data
                      </h2>
                      <p className={css.panelText}>
                        Fill in the public pharmacy data required for
                        verification.
                      </p>
                    </div>

                    <PictureCard
                      name={summaryPharmacyName}
                      pictureUrl={pharmacyPictureUrl}
                      isSaving={isPharmacyPictureSaving}
                      disabled={isProfileReadonly}
                      accept={PICTURE_ACCEPT}
                      labels={{
                        uploadAriaLabel: 'Upload pharmacy photo',
                        hint: 'Upload the public pharmacy photo clients will see in the pharmacy profile.',
                        uploadButton: 'Upload pharmacy photo',
                        removeButton: 'Remove pharmacy photo',
                        removeTitle: 'Remove pharmacy photo?',
                        removeText:
                          'This public pharmacy photo will be removed from the profile.',
                      }}
                      validateFile={(file) =>
                        buildPictureFileError(file) || null
                      }
                      validatePictureUrl={(nextPictureUrl) =>
                        buildPictureUrlError(nextPictureUrl) || null
                      }
                      onChange={handlePharmacyPictureChange}
                      onError={handlePictureError}
                    />

                    {pharmacy.status === 'on_moderation' ? (
                      <PendingModerationBox
                        title="Pending pharmacy data"
                        items={[
                          {
                            label: 'Pharmacy name',
                            value: pharmacy.pendingModeration?.name,
                          },
                          {
                            label: 'Email',
                            value: pharmacy.pendingModeration?.email,
                          },
                          {
                            label: 'Phone',
                            value: pharmacy.pendingModeration?.phone,
                          },
                          {
                            label: 'Address',
                            value: pharmacy.pendingModeration?.address,
                          },
                          {
                            label: 'Working hours',
                            value: pharmacy.pendingModeration?.workingHours,
                          },
                          {
                            label: 'Photo',
                            value:
                              pharmacy.pendingModeration?.imageUrl === null
                                ? 'Photo will be removed'
                                : pharmacy.pendingModeration?.imageUrl
                                  ? 'New photo uploaded'
                                  : undefined,
                          },
                        ]}
                      />
                    ) : null}

                    <div className={css.formGrid}>
                      <NameInput
                        id="pharmacy-name"
                        name="pharmacyName"
                        hint="Clients will see this Pharmacy name in the pharmacy profile on the website."
                        label="Pharmacy name"
                        placeholder="Enter pharmacy name"
                        value={pharmacyValues.name}
                        error={pharmacyErrors.name}
                        isTouched={Boolean(pharmacyTouched.name)}
                        disabled={isProfileReadonly}
                        maxLength={PHARMACY_NAME_MAX_LENGTH}
                        onChange={(event) =>
                          handlePharmacyChange('name', event.target.value)
                        }
                      />

                      <EmailInput
                        id="pharmacy-email"
                        name="email"
                        value={pharmacyValues.email}
                        hint="Clients will see this email in the pharmacy profile on the website."
                        error={pharmacyErrors.email}
                        isTouched={Boolean(pharmacyTouched.email)}
                        disabled={isProfileReadonly}
                        maxLength={USER_EMAIL_MAX_LENGTH}
                        onChange={(event) =>
                          handlePharmacyChange(
                            'email',
                            normalizeEmail(event.target.value)
                          )
                        }
                      />

                      <PhoneInput
                        id="pharmacy-phone"
                        name="phone"
                        value={pharmacyValues.phone}
                        hint="Clients will see this phone number in the pharmacy profile on the website."
                        error={pharmacyErrors.phone}
                        isTouched={Boolean(pharmacyTouched.phone)}
                        disabled={isProfileReadonly}
                        maxLength={USER_PHONE_MAX_LENGTH}
                        onChange={(event) =>
                          handlePharmacyChange(
                            'phone',
                            normalizePhoneInput(event.target.value)
                          )
                        }
                      />

                      <AddressInput
                        id="pharmacy-address"
                        name="address"
                        className={css.fieldWide}
                        label="Pharmacy address"
                        placeholder="Example: 12 Central Street, Kyiv"
                        hint="Clients will see this address in the pharmacy profile on the website."
                        value={pharmacyValues.address}
                        error={pharmacyErrors.address}
                        isTouched={Boolean(pharmacyTouched.address)}
                        disabled={isProfileReadonly}
                        maxLength={USER_ADDRESS_MAX_LENGTH}
                        onChange={(event) =>
                          handlePharmacyChange('address', event.target.value)
                        }
                      />

                      <div className={css.fieldWide}>
                        <WorkingHoursInput
                          id="pharmacy-working-hours"
                          value={pharmacyValues.workingHours}
                          error={pharmacyErrors.workingHours}
                          isTouched={Boolean(pharmacyTouched.workingHours)}
                          disabled={isProfileReadonly}
                          onValueChange={(nextValue) =>
                            handlePharmacyChange('workingHours', nextValue)
                          }
                        />
                      </div>
                    </div>

                    {pharmacy.status === 'new' ? (
                      <Button
                        type="button"
                        disabled={
                          hasValidationErrors(pharmacyErrors) ||
                          !pharmacyFormIsDirty ||
                          isPharmacySaving ||
                          isProfileReadonly
                        }
                        isLoading={isPharmacySaving}
                        loadingLabel="Saving..."
                        onClick={handlePharmacySubmit}
                      >
                        Save pharmacy data
                      </Button>
                    ) : null}
                  </section>
                </div>
              ) : null}

              {activeTab === 'about' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section
                    className={css.panelSection}
                    aria-labelledby="about-title"
                  >
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="about-title">
                        About pharmacy
                      </h2>
                      <p className={css.panelText}>
                        Add the public pharmacy description clients will read on
                        the website.
                      </p>
                    </div>

                    {pharmacy.status === 'on_moderation' ? (
                      <PendingModerationBox
                        title="Pending about pharmacy"
                        items={[
                          {
                            label: 'Description',
                            value: pharmacy.pendingModeration?.description,
                          },
                        ]}
                      />
                    ) : null}

                    <MarkdownTextarea
                      id="pharmacy-description"
                      name="pharmacyDescription"
                      label="Description"
                      value={aboutValues.description}
                      placeholder="Describe pharmacy services, pickup details, and useful information for clients."
                      hint="You can use simple formatting buttons or type plain text."
                      error={aboutErrors.description}
                      isTouched={Boolean(aboutTouched.description)}
                      maxLength={TEXT_EDITOR_MAX_LENGTH}
                      disabled={isProfileReadonly}
                      onValueChange={handleAboutChange}
                    />

                    {pharmacy.status === 'new' ? (
                      <Button
                        type="button"
                        disabled={
                          hasValidationErrors(aboutErrors) ||
                          !aboutFormIsDirty ||
                          isPharmacySaving ||
                          isProfileReadonly
                        }
                        isLoading={isPharmacySaving}
                        loadingLabel="Saving..."
                        onClick={handleAboutSubmit}
                      >
                        Save about pharmacy
                      </Button>
                    ) : null}
                  </section>
                </div>
              ) : null}

              {activeTab === 'payment' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section
                    className={css.panelSection}
                    aria-labelledby="payment-title"
                  >
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="payment-title">
                        Payment details
                      </h2>
                      <p className={css.panelText}>
                        These payment details are required before verification.
                      </p>
                    </div>

                    {pharmacy.status === 'on_moderation' ? (
                      <PendingModerationBox
                        title="Pending payment details"
                        items={[
                          {
                            label: 'Recipient name',
                            value:
                              pharmacy.pendingModeration?.bankDetails
                                ?.recipientName,
                          },
                          {
                            label: 'Tax ID',
                            value:
                              pharmacy.pendingModeration?.bankDetails?.taxId,
                          },
                          {
                            label: 'IBAN',
                            value:
                              pharmacy.pendingModeration?.bankDetails?.iban,
                          },
                          {
                            label: 'Bank name',
                            value:
                              pharmacy.pendingModeration?.bankDetails?.bankName,
                          },
                          {
                            label: 'Receipt email',
                            value:
                              pharmacy.pendingModeration?.bankDetails
                                ?.receiptEmail,
                          },
                          {
                            label: 'Payment purpose',
                            value:
                              pharmacy.pendingModeration?.bankDetails
                                ?.paymentPurpose,
                          },
                        ]}
                      />
                    ) : null}

                    <div className={css.formGrid}>
                      <NameInput
                        id="recipient-name"
                        name="recipientName"
                        label="Recipient name"
                        hint="Enter the legal payment recipient name."
                        value={paymentValues.recipientName}
                        error={paymentErrors.recipientName}
                        isTouched={Boolean(paymentTouched.recipientName)}
                        disabled={isProfileReadonly}
                        maxLength={BANK_RECIPIENT_NAME_MAX_LENGTH}
                        onChange={(event) =>
                          handlePaymentChange(
                            'recipientName',
                            event.target.value
                          )
                        }
                      />

                      <TaxIdInput
                        id="tax-id"
                        name="taxId"
                        value={paymentValues.taxId}
                        error={paymentErrors.taxId}
                        isTouched={Boolean(paymentTouched.taxId)}
                        disabled={isProfileReadonly}
                        maxLength={TAX_ID_MAX_LENGTH}
                        onChange={(event) =>
                          handlePaymentChange(
                            'taxId',
                            sanitizeTaxId(event.target.value)
                          )
                        }
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
                        onChange={(event) =>
                          handlePaymentChange(
                            'iban',
                            normalizeIban(event.target.value)
                          )
                        }
                      />

                      <NameInput
                        id="bank-name"
                        name="bankName"
                        label="Bank name"
                        value={paymentValues.bankName}
                        error={paymentErrors.bankName}
                        isTouched={Boolean(paymentTouched.bankName)}
                        disabled={isProfileReadonly}
                        maxLength={BANK_NAME_MAX_LENGTH}
                        onChange={(event) =>
                          handlePaymentChange('bankName', event.target.value)
                        }
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
                        onChange={(event) =>
                          handlePaymentChange(
                            'receiptEmail',
                            normalizeEmail(event.target.value)
                          )
                        }
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
                        onChange={(event) =>
                          handlePaymentChange(
                            'paymentPurpose',
                            event.target.value
                          )
                        }
                      />
                    </div>

                    {pharmacy.status === 'new' ? (
                      <Button
                        type="button"
                        disabled={
                          hasValidationErrors(paymentErrors) ||
                          !paymentFormIsDirty ||
                          isPharmacySaving ||
                          isProfileReadonly
                        }
                        isLoading={isPharmacySaving}
                        loadingLabel="Saving..."
                        onClick={handlePaymentSubmit}
                      >
                        Save payment details
                      </Button>
                    ) : null}
                  </section>
                </div>
              ) : null}

              {activeTab === 'documents' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section
                    className={css.panelSection}
                    aria-labelledby="documents-title"
                  >
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="documents-title">
                        Registration documents
                      </h2>
                      <p className={css.panelText}>
                        Manage registration documents, license scans, and other
                        files Admin needs for verification.
                      </p>
                    </div>

                    {pharmacy.status === 'on_moderation' ? (
                      <PendingModerationBox
                        title="Pending registration documents"
                        items={(
                          pharmacy.pendingModeration?.documents ?? []
                        ).map((document, index) => ({
                          label: `Document ${index + 1}`,
                          value: document.name,
                        }))}
                      />
                    ) : null}

                    <DocumentUpload
                      id="pharmacy-profile-documents"
                      name="documents"
                      value={documentValues}
                      error={documentsError || pharmacyDocumentsError}
                      isTouched={documentsTouched}
                      required
                      disabled={isProfileReadonly || isDocumentsSaving}
                      maxFiles={PHARMACY_DOCUMENT_RULES.maxFiles}
                      accept={PHARMACY_DOCUMENT_ACCEPT}
                      hint={`PDF, DOC, DOCX, JPG, PNG, or WEBP. Up to ${PHARMACY_DOCUMENT_RULES.maxFiles} files, 10 MB each.`}
                      validateSelection={(files) =>
                        validatePharmacyDocuments(files)
                      }
                      confirmRemove
                      onSelectionError={setDocumentsError}
                      onChange={handleDocumentsChange}
                    />

                    {pharmacy.status === 'new' ? (
                      <Button
                        type="button"
                        disabled={
                          !documentsFormIsDirty ||
                          Boolean(documentsError) ||
                          isDocumentsSaving ||
                          isProfileReadonly
                        }
                        isLoading={isDocumentsSaving}
                        loadingLabel="Saving..."
                        onClick={handleDocumentsSubmit}
                      >
                        Save documents
                      </Button>
                    ) : null}
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

              {activeTab === 'comments' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <EntityComments
                    entityKey={`pharmacy:${pharmacy.id}`}
                    initialTotal={commentsTotal}
                    load={(page, options) =>
                      getPharmacyNotes('pharmacy', pharmacy.id, page, options)
                    }
                    create={(text) =>
                      createPharmacyNote('pharmacy', pharmacy.id, text)
                    }
                    remove={(id) =>
                      deletePharmacyNote('pharmacy', pharmacy.id, id)
                    }
                    onTotalChange={setCommentsTotal}
                  />
                </div>
              ) : null}

              {activeTab === 'sessions' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section
                    className={css.panelSection}
                    aria-labelledby="sessions-title"
                  >
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
                      <>
                        <ul className={css.sessionsList}>
                          {visibleSessions.map((session) => (
                            <li className={css.sessionCard} key={session.id}>
                              <MonitorSmartphone size={22} aria-hidden="true" />
                              <div className={css.sessionInfo}>
                                <strong>
                                  {session.deviceName ??
                                    session.userAgent ??
                                    'Unknown device'}
                                </strong>
                                <span>
                                  Last used:{' '}
                                  {formatSessionDate(session.lastUsedAt)}
                                </span>
                              </div>
                              {session.isCurrent ? (
                                <span className={css.currentSession}>
                                  Current session
                                </span>
                              ) : (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  isLoading={revokingSessionId === session.id}
                                  loadingLabel="Revoking..."
                                  onClick={() =>
                                    void handleRevokeSession(session.id)
                                  }
                                >
                                  Revoke
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>

                        <LazyLoadButton
                          visibleCount={visibleSessions.length}
                          totalCount={sessions.length}
                          label="Show more sessions"
                          onLoadMore={() =>
                            setVisibleSessionsCount(
                              (current) =>
                                current + INITIAL_VISIBLE_SESSIONS_COUNT
                            )
                          }
                        />
                      </>
                    ) : (
                      <div className={css.emptyState}>
                        <h3>No active sessions found</h3>
                        <p>
                          Session data will appear here when the backend returns
                          active login devices.
                        </p>
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
