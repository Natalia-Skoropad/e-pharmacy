'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { Save } from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { useAuth } from '@e-pharmacy/auth/react';
import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { ActiveSession } from '@e-pharmacy/types/auth';
import { useToast } from '@e-pharmacy/ui/feedback';
import { EmailInput, NameInput } from '@e-pharmacy/ui/forms';

import {
  ActiveSessionsPanel,
  ChangePasswordForm,
  ProfileIdentityCard,
  ProfilePictureEditor,
  ProfileTabPanel,
  ProfileTabsLayout,
  type ActiveSessionsPanelStatus,
} from '@e-pharmacy/ui/profile';

import { Button } from '@e-pharmacy/ui/primitives';

import {
  PICTURE_ACCEPT,
  buildPictureFileError,
  buildPictureUrlError,
} from '@e-pharmacy/validation/files';

import {
  ACCOUNT_IDENTITY_FORM_FIELDS,
  isAccountIdentityFormDirty,
  isAccountIdentityFormValid,
  markAllFieldsTouched,
  normalizeAccountIdentityValues,
  validateAccountIdentityForm,
  type AccountIdentityFormErrors,
  type AccountIdentityTouchedFields,
  type AccountIdentityFormValues,
  type ChangePasswordFormValues,
} from '@e-pharmacy/validation/profile';

import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
} from '@e-pharmacy/validation/auth';

import { updateMyAdminEmployeeProfile } from '@/lib/api/browser/admin-profile.api';

import {
  getActiveSessions,
  revokeActiveSession,
  updateCurrentUserPassword,
} from '@/lib/api/browser/auth.api';

import { getAdminPasswordChangeErrorMessage } from '@/lib/auth/admin-auth-error-messages';
import { ADMIN_ACCESS_ERROR_CODES } from '@/lib/permissions/admin-access';
import { ADMIN_ROUTES } from '@/lib/routes';
import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';

import { AdminDocuments } from '../AdminDocuments';
import { AdminPrivateComments } from '../AdminPrivateComments';

import css from './AdminProfilePageContent.module.css';

//===================================================================

const PERSONAL_TAB = 'personal' as const;
const DOCUMENTS_TAB = 'documents' as const;
const COMMENTS_TAB = 'comments' as const;
const SESSIONS_TAB = 'sessions' as const;

//===================================================================

type ProfileTab =
  | typeof PERSONAL_TAB
  | typeof DOCUMENTS_TAB
  | typeof COMMENTS_TAB
  | typeof SESSIONS_TAB;

//===================================================================

const PROFILE_TABS = [
  { value: PERSONAL_TAB, label: 'Personal information' },
  { value: DOCUMENTS_TAB, label: 'Documents' },
  { value: COMMENTS_TAB, label: 'Comments' },
  { value: SESSIONS_TAB, label: 'Active sessions' },
] as const;

//===================================================================

const AUTH_EMAIL_CONFLICT = 'AUTH_EMAIL_CONFLICT';
const AUTH_PROFILE_CONFLICT = 'AUTH_PROFILE_CONFLICT';

//===================================================================

function getProfileErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return 'Could not update the profile. Please try again.';
  }

  if (error.backendCode === AUTH_EMAIL_CONFLICT) {
    return 'This email is already used by another account.';
  }

  if (error.backendCode === AUTH_PROFILE_CONFLICT) {
    return 'The profile changed in another session. Reload the page and try again.';
  }

  if (error.backendCode === ADMIN_ACCESS_ERROR_CODES.PLATFORM_OWNER_REQUIRED) {
    return 'Only a Platform Owner can change the admin name or email.';
  }

  return 'Could not update the profile. Please try again.';
}

//===================================================================

export function AdminProfilePageContent() {
  const { user, applyCurrentUser, invalidateSession, logoutAll } = useAuth();
  const { access } = useAdminAuthorization();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<ProfileTab>(PERSONAL_TAB);

  const [identityDraft, setIdentityDraft] =
    useState<AccountIdentityFormValues | null>(null);

  const [errors, setErrors] = useState<AccountIdentityFormErrors>({});

  const [touchedFields, setTouchedFields] =
    useState<AccountIdentityTouchedFields>({});

  const [pictureDraft, setPictureDraft] = useState<string | null | undefined>(
    undefined
  );

  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isSavingPicture, setIsSavingPicture] = useState(false);
  const profileMutationInFlightRef = useRef(false);

  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordSubmitError, setPasswordSubmitError] = useState('');
  const passwordMutationInFlightRef = useRef(false);

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsStatus, setSessionsStatus] =
    useState<ActiveSessionsPanelStatus>('loading');

  const [sessionsError, setSessionsError] = useState('');
  const [sessionsReloadKey, setSessionsReloadKey] = useState(0);

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null
  );

  const [isSigningOutAll, setIsSigningOutAll] = useState(false);
  const sessionMutationInFlightRef = useRef(false);

  const identityValues = useMemo<AccountIdentityFormValues>(
    () =>
      identityDraft ?? {
        name: user?.name ?? '',
        email: user?.email ?? '',
      },
    [identityDraft, user?.email, user?.name]
  );

  const initialIdentityValues = useMemo<AccountIdentityFormValues>(
    () => ({ name: user?.name ?? '', email: user?.email ?? '' }),
    [user?.email, user?.name]
  );

  useEffect(() => {
    if (activeTab !== SESSIONS_TAB || !user) return;

    const controller = new AbortController();

    void getActiveSessions({ signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        setSessions([...response.sessions]);
        setSessionsStatus('success');
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setSessionsError('Could not load active sessions. Please try again.');
        setSessionsStatus('error');
      });

    return () => controller.abort();
  }, [activeTab, sessionsReloadKey, user]);

  if (!user) return null;

  const isPlatformOwner = access.isPlatformOwner;
  const isIdentityDirty = isAccountIdentityFormDirty(
    identityValues,
    initialIdentityValues
  );
  const isIdentityValid = isAccountIdentityFormValid(identityValues);
  const pictureUrl =
    pictureDraft === undefined ? (user.pictureUrl ?? null) : pictureDraft;

  const handleIdentityChange =
    (field: keyof AccountIdentityFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!isPlatformOwner || isSavingIdentity || isSavingPicture) return;

      const nextValues = { ...identityValues, [field]: event.target.value };
      const nextErrors = validateAccountIdentityForm(nextValues);

      setIdentityDraft(nextValues);
      setTouchedFields((current) => ({ ...current, [field]: true }));
      setErrors((current) => ({ ...current, [field]: nextErrors[field] }));
    };

  const handleIdentitySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isPlatformOwner || profileMutationInFlightRef.current) return;

    const nextErrors = validateAccountIdentityForm(identityValues);

    if (Object.keys(nextErrors).length > 0) {
      setTouchedFields(markAllFieldsTouched(ACCOUNT_IDENTITY_FORM_FIELDS));
      setErrors(nextErrors);
      return;
    }

    if (!isIdentityDirty) return;

    profileMutationInFlightRef.current = true;
    setIsSavingIdentity(true);

    try {
      const normalized = normalizeAccountIdentityValues(identityValues);
      const response = await updateMyAdminEmployeeProfile({
        ...normalized,
        expectedRevision: user.revision,
      });

      applyCurrentUser(response.user);
      setIdentityDraft(null);
      setErrors({});
      setTouchedFields({});
      toast.success('Personal information was updated.');
    } catch (error) {
      toast.error(getProfileErrorMessage(error));
    } finally {
      profileMutationInFlightRef.current = false;
      setIsSavingIdentity(false);
    }
  };

  const handlePictureChange = async (nextPictureUrl: string | null) => {
    if (profileMutationInFlightRef.current) return;

    profileMutationInFlightRef.current = true;
    setPictureDraft(nextPictureUrl);
    setIsSavingPicture(true);

    try {
      const response = await updateMyAdminEmployeeProfile({
        pictureUrl: nextPictureUrl,
        expectedRevision: user.revision,
      });

      applyCurrentUser(response.user);
      setPictureDraft(undefined);
      toast.success(
        nextPictureUrl
          ? 'Profile photo was updated.'
          : 'Profile photo was removed.'
      );
    } catch (error) {
      setPictureDraft(undefined);
      toast.error(getProfileErrorMessage(error));
    } finally {
      profileMutationInFlightRef.current = false;
      setIsSavingPicture(false);
    }
  };

  const handlePasswordSubmit = async (
    values: Readonly<ChangePasswordFormValues>
  ) => {
    if (passwordMutationInFlightRef.current) return;

    passwordMutationInFlightRef.current = true;
    setIsPasswordSaving(true);
    setPasswordSubmitError('');

    try {
      await updateCurrentUserPassword(values);
      invalidateSession('password_changed');
      toast.success('Password changed. Log in with your new password.');
      window.location.replace(ADMIN_ROUTES.LOGIN);
    } catch (error) {
      const message = getAdminPasswordChangeErrorMessage(
        getAuthErrorCode(error)
      );

      setPasswordSubmitError(message);
      toast.error(message);
    } finally {
      passwordMutationInFlightRef.current = false;
      setIsPasswordSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (sessionMutationInFlightRef.current) return;

    sessionMutationInFlightRef.current = true;
    setRevokingSessionId(sessionId);

    try {
      await revokeActiveSession(sessionId);
      setSessions((current) =>
        current.filter((session) => session.id !== sessionId)
      );
      setSessionsReloadKey((current) => current + 1);
      toast.success('Session was revoked.');
    } catch {
      toast.error('Could not revoke the session. Please try again.');
    } finally {
      sessionMutationInFlightRef.current = false;
      setRevokingSessionId(null);
    }
  };

  const handleLogoutAllSessions = async () => {
    if (!logoutAll || sessionMutationInFlightRef.current) return;

    sessionMutationInFlightRef.current = true;
    setIsSigningOutAll(true);

    try {
      await logoutAll();
    } catch {
      toast.error(
        'This browser was signed out, but other device sessions could not be revoked.'
      );
    } finally {
      sessionMutationInFlightRef.current = false;
      setIsSigningOutAll(false);
      window.location.replace(ADMIN_ROUTES.LOGIN);
    }
  };

  return (
    <section className={css.page} aria-labelledby="admin-profile-title">
      <div className={css.heading}>
        <h1 id="admin-profile-title">Profile</h1>
        <p>Manage your Admin Cabinet identity and account security.</p>
      </div>

      <ProfileTabsLayout
        idBase="admin-profile"
        items={[...PROFILE_TABS]}
        activeValue={activeTab}
        ariaLabel="Admin profile sections"
        sidebar={
          <ProfileIdentityCard
            name={user.name}
            email={user.email}
            roleLabel={isPlatformOwner ? 'Platform Owner' : 'Admin employee'}
            statusLabel={USER_STATUS_PRESENTATION[user.status].label}
            pictureEditor={
              <ProfilePictureEditor
                pictureUrl={pictureUrl}
                name={user.name}
                accept={PICTURE_ACCEPT}
                disabled={isSavingPicture || isSavingIdentity}
                isSaving={isSavingPicture}
                validateFile={(file) => buildPictureFileError(file) || null}
                validatePictureUrl={(value) =>
                  buildPictureUrlError(value) || null
                }
                onChange={handlePictureChange}
                onError={toast.error}
              />
            }
          />
        }
        onChange={(nextTab) => {
          if (nextTab === SESSIONS_TAB) {
            setSessionsStatus('loading');
            setSessionsError('');
          }

          setActiveTab(nextTab);
        }}
      >
        <ProfileTabPanel
          idBase="admin-profile"
          value={PERSONAL_TAB}
          activeValue={activeTab}
        >
          {activeTab === PERSONAL_TAB ? (
            <>
              <form
                className={css.personalForm}
                noValidate
                onSubmit={handleIdentitySubmit}
              >
                <div className={css.formHeader}>
                  <div>
                    <h2>Personal information</h2>
                    <p>
                      {isPlatformOwner
                        ? 'Keep the Platform Owner name and email up to date.'
                        : 'Your name and email are managed by the Platform Owner.'}
                    </p>
                  </div>

                  {isPlatformOwner ? (
                    <Button
                      type="submit"
                      iconLeft={<Save size={18} aria-hidden="true" />}
                      disabled={
                        isSavingIdentity ||
                        isSavingPicture ||
                        !isIdentityDirty ||
                        !isIdentityValid
                      }
                      isLoading={isSavingIdentity}
                      loadingLabel="Saving..."
                    >
                      Save changes
                    </Button>
                  ) : null}
                </div>

                <div className={css.formGrid}>
                  <NameInput
                    id="admin-profile-name"
                    name="name"
                    value={identityValues.name}
                    error={errors.name}
                    isTouched={Boolean(touchedFields.name)}
                    required={isPlatformOwner}
                    maxLength={USER_NAME_MAX_LENGTH}
                    disabled={
                      !isPlatformOwner || isSavingIdentity || isSavingPicture
                    }
                    onChange={handleIdentityChange('name')}
                  />

                  <EmailInput
                    id="admin-profile-email"
                    name="email"
                    value={identityValues.email}
                    error={errors.email}
                    isTouched={Boolean(touchedFields.email)}
                    required={isPlatformOwner}
                    maxLength={USER_EMAIL_MAX_LENGTH}
                    disabled={
                      !isPlatformOwner || isSavingIdentity || isSavingPicture
                    }
                    onChange={handleIdentityChange('email')}
                  />
                </div>
              </form>

              <ChangePasswordForm
                idPrefix="admin-profile-password"
                description="Update your password and sign in again on this device."
                isSubmitting={isPasswordSaving}
                error={passwordSubmitError}
                onSubmit={handlePasswordSubmit}
              />
            </>
          ) : null}
        </ProfileTabPanel>

        <ProfileTabPanel
          idBase="admin-profile"
          value={DOCUMENTS_TAB}
          activeValue={activeTab}
        >
          {activeTab === DOCUMENTS_TAB ? (
            <AdminDocuments isPlatformOwner={isPlatformOwner} />
          ) : null}
        </ProfileTabPanel>

        <ProfileTabPanel
          idBase="admin-profile"
          value={COMMENTS_TAB}
          activeValue={activeTab}
        >
          {activeTab === COMMENTS_TAB ? <AdminPrivateComments /> : null}
        </ProfileTabPanel>

        <ProfileTabPanel
          idBase="admin-profile"
          value={SESSIONS_TAB}
          activeValue={activeTab}
        >
          {activeTab === SESSIONS_TAB ? (
            <ActiveSessionsPanel
              sessions={sessions}
              status={sessionsStatus}
              error={sessionsError}
              description="Review devices signed in to your admin account and revoke sessions you no longer use."
              revokingSessionId={revokingSessionId}
              isSigningOutAll={isSigningOutAll}
              onRetry={() => {
                setSessionsStatus('loading');
                setSessionsError('');
                setSessionsReloadKey((current) => current + 1);
              }}
              onRevoke={handleRevokeSession}
              {...(logoutAll ? { onSignOutAll: handleLogoutAllSessions } : {})}
            />
          ) : null}
        </ProfileTabPanel>
      </ProfileTabsLayout>
    </section>
  );
}
