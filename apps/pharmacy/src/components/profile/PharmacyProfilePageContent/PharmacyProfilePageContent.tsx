'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import {
  FileCheck2,
  MessageSquareLock,
  MonitorSmartphone,
  Plus,
  Save,
  UserRound,
} from 'lucide-react';

import { useAuth } from '@e-pharmacy/auth/react';
import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { ActiveSession } from '@e-pharmacy/types/auth';
import { useToast } from '@e-pharmacy/ui/feedback';
import { NameInput, PhoneInput, EmailInput } from '@e-pharmacy/ui/forms';
import { Container } from '@e-pharmacy/ui/layout';
import { Button } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import {
  ActiveSessionsPanel,
  ChangePasswordForm,
  ProfileIdentityCard,
  ProfilePageLoader,
  ProfilePictureEditor,
  ProfileSectionHeader,
  ProfileTabPanel,
  ProfileTabsLayout,
  type ActiveSessionsPanelStatus,
} from '@e-pharmacy/ui/profile';

import {
  PICTURE_ACCEPT,
  buildPictureFileError,
  buildPictureUrlError,
} from '@e-pharmacy/validation/files';

import {
  isDataProfileFormValid,
  normalizePhoneInput,
  USER_NAME_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  type ChangePasswordFormValues,
} from '@e-pharmacy/validation/profile';

import {
  getActiveSessions,
  revokeActiveSession,
  updateCurrentUser,
  updateCurrentUserPassword,
} from '@/lib/api/browser';

import { getSharedLoginUrl } from '@/lib/auth/shared-auth';
import { getPharmacyPasswordChangeErrorMessage } from '@/lib/auth/pharmacy-auth-error-messages';
import { getProfileErrorMessage } from '@/lib/errors/get-profile-error-message';
import { PHARMACY_ROUTES } from '@/lib/routes/pharmacy-routes';

import { OwnerDocumentsPanel } from '../OwnerDocumentsPanel';
import { OwnerPrivateComments } from '../OwnerPrivateComments';

import css from './PharmacyProfilePageContent.module.css';

//===================================================================

type AuthUser = NonNullable<ReturnType<typeof useAuth>['user']>;
type ProfileTab = 'data' | 'documents' | 'comments' | 'sessions';

//===================================================================

const PROFILE_TABS_ID_BASE = 'owner-profile-tabs';

//===================================================================

const TABS = [
  {
    value: 'data',
    label: 'Personal information',
    icon: <UserRound size={17} aria-hidden="true" />,
  },
  {
    value: 'documents',
    label: 'Owner documents',
    icon: <FileCheck2 size={17} aria-hidden="true" />,
  },
  {
    value: 'comments',
    label: 'Private comments',
    icon: <MessageSquareLock size={17} aria-hidden="true" />,
  },
  {
    value: 'sessions',
    label: 'Active sessions',
    icon: <MonitorSmartphone size={17} aria-hidden="true" />,
  },
] satisfies Array<{ value: ProfileTab; label: string; icon: ReactNode }>;

//===================================================================

function OwnerActiveSessionsSection() {
  const { logoutAll } = useAuth();
  const toast = useToast();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);

  const [sessionsStatus, setSessionsStatus] =
    useState<ActiveSessionsPanelStatus>('loading');

  const [sessionsError, setSessionsError] = useState('');
  const [sessionsVersion, setSessionsVersion] = useState(0);

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null
  );

  const [signingOutAll, setSigningOutAll] = useState(false);
  const sessionsMutationRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    void getActiveSessions({ signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        setSessions([...response.sessions]);
        setSessionsStatus('success');
      })

      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        setSessionsError(
          getProfileErrorMessage(cause, 'Could not load active sessions.')
        );

        setSessionsStatus('error');
      });

    return () => controller.abort();
  }, [sessionsVersion]);

  const reloadSessions = () => {
    setSessionsStatus('loading');
    setSessionsError('');
    setSessionsVersion((version) => version + 1);
  };

  return (
    <ActiveSessionsPanel
      sessions={sessions}
      status={sessionsStatus}
      error={sessionsError}
      description="Review and revoke sessions for your owner account."
      revokingSessionId={revokingSessionId}
      isSigningOutAll={signingOutAll}
      onRetry={reloadSessions}
      onRevoke={async (sessionId) => {
        if (sessionsMutationRef.current) return;

        sessionsMutationRef.current = true;
        setRevokingSessionId(sessionId);

        try {
          await revokeActiveSession(sessionId);

          setSessions((current) =>
            current.filter((session) => session.id !== sessionId)
          );

          reloadSessions();
          toast.success('Session was revoked.');
        } catch (cause) {
          toast.error(
            getProfileErrorMessage(cause, 'Could not revoke session.')
          );
        } finally {
          setRevokingSessionId(null);
          sessionsMutationRef.current = false;
        }
      }}
      {...(logoutAll
        ? {
            onSignOutAll: async () => {
              if (sessionsMutationRef.current) return;

              sessionsMutationRef.current = true;
              setSigningOutAll(true);

              try {
                await logoutAll();
              } catch {
                toast.error('Could not sign out all devices.');
              } finally {
                setSigningOutAll(false);
                sessionsMutationRef.current = false;
                window.location.replace(getSharedLoginUrl());
              }
            },
          }
        : {})}
    />
  );
}

//===================================================================

// Every owner, including one with no pharmacies, uses the same personal
// account UI. Pharmacy-scoped profile and moderation data are never fetched.
function OwnerProfile({ user }: Readonly<{ user: AuthUser }>) {
  const { applyCurrentUser, invalidateSession } = useAuth();
  const toast = useToast();
  const pathname = usePathname();
  const routeTab = pathname.slice(`${PHARMACY_ROUTES.PROFILE}/`.length);

  const activeTab: ProfileTab =
    pathname.startsWith(`${PHARMACY_ROUTES.PROFILE}/`) &&
    TABS.some(({ value }) => value === routeTab)
      ? (routeTab as ProfileTab)
      : 'data';

  const [name, setName] = useState(user.name ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [savingPicture, setSavingPicture] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const mutationRef = useRef(false);
  const passwordRef = useRef(false);

  const values = { name, phone, address: user.address ?? '' };

  const canSave =
    isDataProfileFormValid(values) &&
    (name.trim() !== user.name || phone.trim() !== (user.phone ?? '')) &&
    !saving;

  const handleSave = async () => {
    if (!canSave || mutationRef.current) return;

    mutationRef.current = true;
    setSaving(true);

    try {
      const response = await updateCurrentUser({
        name: name.trim(),
        phone: phone.trim(),
        expectedRevision: user.revision,
      });

      applyCurrentUser(response.user);
      setName(response.user.name);
      setPhone(response.user.phone ?? '');

      toast.success('Personal information saved.');
    } catch (cause) {
      toast.error(
        getProfileErrorMessage(cause, 'Could not save personal information.')
      );
    } finally {
      setSaving(false);
      mutationRef.current = false;
    }
  };

  const handlePictureChange = async (pictureUrl: string | null) => {
    if (mutationRef.current) return;

    mutationRef.current = true;
    setSavingPicture(true);

    try {
      const response = await updateCurrentUser({
        pictureUrl,
        expectedRevision: user.revision,
      });

      applyCurrentUser(response.user);
      toast.success('Profile photo updated.');
    } catch (cause) {
      toast.error(
        getProfileErrorMessage(cause, 'Could not update profile photo.')
      );
    } finally {
      setSavingPicture(false);
      mutationRef.current = false;
    }
  };

  const handlePassword = async (values: Readonly<ChangePasswordFormValues>) => {
    if (passwordRef.current) return;

    passwordRef.current = true;
    setSavingPassword(true);

    try {
      await updateCurrentUserPassword(values);

      invalidateSession('password_changed');
      toast.success('Password changed. Sign in again.');
      window.location.replace(getSharedLoginUrl());
    } catch (cause) {
      toast.error(
        getPharmacyPasswordChangeErrorMessage(getAuthErrorCode(cause))
      );
    } finally {
      setSavingPassword(false);
      passwordRef.current = false;
    }
  };

  // Stage 14.18.7 introduces pharmacy creation. Until the route and its
  // permission-aware API exist, do not navigate to a broken/unauthorized URL.
  const canCreatePharmacy = user.role === 'pharmacy';

  return (
    <main className={css.page} aria-label="Owner profile">
      <Container className={css.profileContainer}>
        <ProfileTabsLayout
          idBase={PROFILE_TABS_ID_BASE}
          items={TABS}
          activeValue={activeTab}
          ariaLabel="Owner profile sections"
          onChange={(next) => {
            const url =
              next === 'data'
                ? PHARMACY_ROUTES.PROFILE
                : `${PHARMACY_ROUTES.PROFILE}/${next}`;

            window.history.pushState(null, '', url);
          }}
          sidebar={
            <ProfileIdentityCard
              name={user.name}
              email={user.email}
              roleLabel="Pharmacy owner"
              statusContent={
                <StatusBadge {...USER_STATUS_PRESENTATION[user.status]} />
              }
              pictureEditor={
                <ProfilePictureEditor
                  name={user.name}
                  pictureUrl={user.pictureUrl ?? null}
                  disabled={savingPicture}
                  isSaving={savingPicture}
                  accept={PICTURE_ACCEPT}
                  validateFile={(file) => buildPictureFileError(file) || null}
                  validatePictureUrl={(url) =>
                    buildPictureUrlError(url) || null
                  }
                  onChange={handlePictureChange}
                  onError={toast.error}
                />
              }
            >
              {canCreatePharmacy ? (
                <div className={css.createPharmacy}>
                  <Button
                    type="button"
                    fullWidth
                    disabled
                    aria-describedby="owner-create-pharmacy-unavailable"
                    iconLeft={<Plus size={18} aria-hidden="true" />}
                  >
                    Create pharmacy
                  </Button>
                  <p
                    id="owner-create-pharmacy-unavailable"
                    className={css.note}
                  >
                    Pharmacy creation will become available in a later stage.
                  </p>
                </div>
              ) : null}
            </ProfileIdentityCard>
          }
        >
          <ProfileTabPanel
            idBase={PROFILE_TABS_ID_BASE}
            value="data"
            activeValue={activeTab}
          >
            {activeTab === 'data' ? (
              <>
                <form
                  className={css.personalForm}
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSave();
                  }}
                >
                  <ProfileSectionHeader
                    title="Personal information"
                    titleId="owner-personal-information-title"
                    description="Manage your personal account details. Email changes are not available yet."
                    icon={<UserRound size={22} />}
                  />

                  <div className={css.formGrid}>
                    <NameInput
                      id="owner-profile-name"
                      name="name"
                      value={name}
                      maxLength={USER_NAME_MAX_LENGTH}
                      onChange={(event) => setName(event.target.value)}
                    />

                    <PhoneInput
                      id="owner-profile-phone"
                      name="phone"
                      value={phone}
                      maxLength={USER_PHONE_MAX_LENGTH}
                      onChange={(event) =>
                        setPhone(normalizePhoneInput(event.target.value))
                      }
                    />

                    <EmailInput
                      id="owner-profile-email"
                      name="email"
                      value={user.email}
                      disabled
                      onChange={() => undefined}
                    />
                  </div>

                  <Button
                    type="submit"
                    iconLeft={<Save size={18} aria-hidden="true" />}
                    disabled={!canSave}
                    isLoading={saving}
                    loadingLabel="Saving..."
                  >
                    Save my data
                  </Button>
                </form>

                <ChangePasswordForm
                  idPrefix="owner-profile-password"
                  description="Change your password and sign in again on this device."
                  isSubmitting={savingPassword}
                  onSubmit={handlePassword}
                />
              </>
            ) : null}
          </ProfileTabPanel>

          <ProfileTabPanel
            idBase={PROFILE_TABS_ID_BASE}
            value="documents"
            activeValue={activeTab}
          >
            {activeTab === 'documents' && canCreatePharmacy ? (
              <OwnerDocumentsPanel />
            ) : null}
          </ProfileTabPanel>

          <ProfileTabPanel
            idBase={PROFILE_TABS_ID_BASE}
            value="comments"
            activeValue={activeTab}
          >
            {activeTab === 'comments' ? <OwnerPrivateComments /> : null}
          </ProfileTabPanel>

          <ProfileTabPanel
            idBase={PROFILE_TABS_ID_BASE}
            value="sessions"
            activeValue={activeTab}
          >
            {activeTab === 'sessions' ? (
              <OwnerActiveSessionsSection key={user.id} />
            ) : null}
          </ProfileTabPanel>
        </ProfileTabsLayout>
      </Container>
    </main>
  );
}

//===================================================================

export function PharmacyProfilePageContent() {
  const { user } = useAuth();

  if (!user) {
    return (
      <main className={css.page} aria-label="Loading owner profile">
        <ProfilePageLoader label="Loading owner profile..." />
      </main>
    );
  }
  // Remount the personal form if the logged-in identity changes.
  return <OwnerProfile key={user.id} user={user} />;
}

export default PharmacyProfilePageContent;
