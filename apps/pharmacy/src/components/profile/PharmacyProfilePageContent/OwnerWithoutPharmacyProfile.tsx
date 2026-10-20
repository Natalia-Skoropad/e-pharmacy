'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FileCheck2, MonitorSmartphone, Save, UserRound } from 'lucide-react';

import { useAuth } from '@e-pharmacy/auth/react';
import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { ActiveSession } from '@e-pharmacy/types/auth';
import { useToast } from '@e-pharmacy/ui/feedback';
import { NameInput, PhoneInput } from '@e-pharmacy/ui/forms';
import { Container } from '@e-pharmacy/ui/layout';
import { Button } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import {
  ActiveSessionsPanel,
  ChangePasswordForm,
  ProfileIdentityCard,
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

import css from './PharmacyProfilePageContent.module.css';

//===================================================================

// Active sessions are mounted only when the Sessions tab is visible.
// Initial loading state belongs to this component, not to a synchronous
// setState inside the fetching effect.
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

// Stage 14.18.2 zero-pharmacy entry. Uses canonical shared profile widgets;
// 14.18.5 will merge both profile variants into one owner-first profile.
export function OwnerWithoutPharmacyProfile() {
  const { user, applyCurrentUser, invalidateSession } = useAuth();

  const toast = useToast();
  const pathname = usePathname();

  const tab = pathname.slice(`${PHARMACY_ROUTES.PROFILE}/`.length);
  const activeTab = tab === 'documents' || tab === 'sessions' ? tab : 'data';

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  const [saving, setSaving] = useState(false);
  const [savingPicture, setSavingPicture] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const mutationRef = useRef(false);
  const passwordRef = useRef(false);

  if (!user) return null;

  const values = { name, phone, address: user.address ?? '' };

  const canSave =
    isDataProfileFormValid(values) &&
    (name !== user.name || phone !== user.phone) &&
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
      toast.success('My data saved successfully.');
    } catch (cause) {
      toast.error(getProfileErrorMessage(cause, 'Could not save my data.'));
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
      mutationRef.current = false;
      setSavingPicture(false);
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
      window.location.assign(getSharedLoginUrl());
    } catch (cause) {
      toast.error(
        getPharmacyPasswordChangeErrorMessage(getAuthErrorCode(cause))
      );
    } finally {
      setSavingPassword(false);
      passwordRef.current = false;
    }
  };

  return (
    <main className={css.page}>
      <Container className={css.profileContainer}>
        <ProfileTabsLayout
          idBase="owner-account-profile"
          items={[
            {
              value: 'data',
              label: 'My data',
              icon: <UserRound size={17} aria-hidden="true" />,
            },
            {
              value: 'documents',
              label: 'Owner documents',
              icon: <FileCheck2 size={17} aria-hidden="true" />,
            },
            {
              value: 'sessions',
              label: 'Active sessions',
              icon: <MonitorSmartphone size={17} aria-hidden="true" />,
            },
          ]}
          activeValue={activeTab}
          ariaLabel="Owner account profile"
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
              <p className={css.panelText}>
                Your owner account is ready. You have no pharmacies yet.
                Pharmacy creation is added in Stage 14.18.7.
              </p>
            </ProfileIdentityCard>
          }
        >
          <ProfileTabPanel
            idBase="owner-account-profile"
            value="data"
            activeValue={activeTab}
          >
            {activeTab === 'data' ? (
              <>
                <form
                  className={css.panelSection}
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSave();
                  }}
                >
                  <ProfileSectionHeader
                    title="Personal information"
                    titleId="owner-account-personal-info"
                    description={`Account email: ${user.email}`}
                    icon={<UserRound size={22} />}
                  />

                  <div className={css.formGrid}>
                    <NameInput
                      id="owner-account-name"
                      name="name"
                      value={name}
                      maxLength={USER_NAME_MAX_LENGTH}
                      onChange={(event) => setName(event.target.value)}
                    />

                    <PhoneInput
                      id="owner-account-phone"
                      name="phone"
                      value={phone}
                      maxLength={USER_PHONE_MAX_LENGTH}
                      onChange={(event) =>
                        setPhone(normalizePhoneInput(event.target.value))
                      }
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
                  idPrefix="owner-account-password"
                  isSubmitting={savingPassword}
                  onSubmit={handlePassword}
                />
              </>
            ) : null}
          </ProfileTabPanel>

          <ProfileTabPanel
            idBase="owner-account-profile"
            value="documents"
            activeValue={activeTab}
          >
            {activeTab === 'documents' ? <OwnerDocumentsPanel /> : null}
          </ProfileTabPanel>

          <ProfileTabPanel
            idBase="owner-account-profile"
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
