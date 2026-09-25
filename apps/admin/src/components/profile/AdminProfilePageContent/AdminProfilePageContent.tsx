'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { useAuth } from '@e-pharmacy/auth/react';
import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { ActiveSession } from '@e-pharmacy/types/auth';
import { useToast } from '@e-pharmacy/ui/feedback';
import { NameInput, PhoneInput } from '@e-pharmacy/ui/forms';

import {
  ActiveSessionsPanel,
  ChangePasswordForm,
  ProfileIdentityCard,
  ProfilePictureEditor,
  ProfileTabPanel,
  ProfileTabsLayout,
  type ActiveSessionsPanelStatus,
} from '@e-pharmacy/ui/profile';

import {
  PICTURE_ACCEPT,
  buildPictureFileError,
  buildPictureUrlError,
} from '@e-pharmacy/validation/files';

import type { ChangePasswordFormValues } from '@e-pharmacy/validation/profile';

import { getMyAdminDocuments } from '@/lib/api/browser/admin-documents.api';
import { getMyAdminPrivateComments } from '@/lib/api/browser/admin-private-comments.api';
import { updateMyAdminEmployeeProfile } from '@/lib/api/browser/admin-profile.api';

import {
  getActiveSessions,
  revokeActiveSession,
  updateCurrentUserPassword,
} from '@/lib/api/browser/auth.api';

import { getAdminPasswordChangeErrorMessage } from '@/lib/auth/admin-auth-error-messages';
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

export function AdminProfilePageContent() {
  const { user, applyCurrentUser, invalidateSession, logoutAll } = useAuth();
  const { access } = useAdminAuthorization();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>(PERSONAL_TAB);

  const [pictureDraft, setPictureDraft] = useState<string | null | undefined>(
    undefined
  );

  const [isSavingPicture, setIsSavingPicture] = useState(false);
  const profileMutationInFlightRef = useRef(false);
  const passwordMutationInFlightRef = useRef(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
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

  const tabs = useMemo(
    () => [
      { value: PERSONAL_TAB, label: 'Personal information' },
      { value: DOCUMENTS_TAB, label: `Documents (${documentsCount})` },
      { value: COMMENTS_TAB, label: `Comments (${commentsCount})` },
      { value: SESSIONS_TAB, label: 'Active sessions' },
    ],
    [commentsCount, documentsCount]
  );

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();

    void getMyAdminDocuments({ signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted)
          setDocumentsCount(response.documents.length);
      })
      .catch(() => undefined);

    void getMyAdminPrivateComments(1, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setCommentsCount(response.total);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [user]);

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

  const pictureUrl =
    pictureDraft === undefined ? (user.pictureUrl ?? null) : pictureDraft;

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
    } catch {
      setPictureDraft(undefined);
      toast.error('Could not update the profile photo. Please try again.');
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

    try {
      await updateCurrentUserPassword(values);
      invalidateSession('password_changed');
      toast.success('Password changed. Log in with your new password.');
      window.location.replace(ADMIN_ROUTES.LOGIN);
    } catch (error) {
      toast.error(getAdminPasswordChangeErrorMessage(getAuthErrorCode(error)));
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
    <section className={css.page} aria-label="Admin profile">
      <ProfileTabsLayout
        idBase="admin-profile"
        items={tabs}
        activeValue={activeTab}
        ariaLabel="Admin profile sections"
        sidebar={
          <ProfileIdentityCard
            name={user.name}
            email={user.email}
            roleLabel={
              access.isPlatformOwner ? 'Platform Owner' : 'Admin employee'
            }
            statusLabel={USER_STATUS_PRESENTATION[user.status].label}
            pictureEditor={
              <ProfilePictureEditor
                pictureUrl={pictureUrl}
                name={user.name}
                accept={PICTURE_ACCEPT}
                disabled={isSavingPicture}
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
              <section
                className={css.personalForm}
                aria-labelledby="admin-personal-information-title"
              >
                <div className={css.formHeader}>
                  <div>
                    <h2 id="admin-personal-information-title">
                      Personal information
                    </h2>
                    <p>
                      Employee identity is managed from the Employees section.
                    </p>
                  </div>
                </div>

                <div className={css.formGrid}>
                  <NameInput
                    id="admin-profile-name"
                    name="name"
                    value={user.name}
                    disabled
                    onChange={() => undefined}
                  />

                  <PhoneInput
                    id="admin-profile-phone"
                    name="phone"
                    value={user.phone}
                    disabled
                    onChange={() => undefined}
                  />
                </div>
              </section>

              <ChangePasswordForm
                idPrefix="admin-profile-password"
                description="Update your password and sign in again on this device."
                isSubmitting={isPasswordSaving}
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
          {activeTab === DOCUMENTS_TAB ? <AdminDocuments /> : null}
        </ProfileTabPanel>

        <ProfileTabPanel
          idBase="admin-profile"
          value={COMMENTS_TAB}
          activeValue={activeTab}
        >
          {activeTab === COMMENTS_TAB ? (
            <AdminPrivateComments onTotalChange={setCommentsCount} />
          ) : null}
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
