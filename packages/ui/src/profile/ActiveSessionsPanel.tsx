'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  ChevronDown,
  History,
  LogOut,
  MonitorSmartphone,
  X,
} from 'lucide-react';

import type { ActiveSession } from '@e-pharmacy/types/auth';
import { formatDateTime } from '@e-pharmacy/utils/date';

import { Button } from '../primitives/Button/Button';
import { LazyLoadButton } from '../primitives/LazyLoadButton/LazyLoadButton';
import { CountLabel } from '../data-display/CountLabel/CountLabel';
import { PaginationView } from '../navigation/PaginationView/PaginationView';
import { ConfirmationModal } from '../overlays/ConfirmationModal/ConfirmationModal';
import { ProfileResourceState } from './ProfileResourceState';
import { ProfileSectionHeader } from './ProfileSectionHeader';

import css from './Profile.module.css';

//===================================================================

export type ActiveSessionsPanelStatus = 'loading' | 'success' | 'error';

//===================================================================

export type ActiveSessionsPanelProps = Readonly<{
  sessions: readonly ActiveSession[];
  status: ActiveSessionsPanelStatus;
  idPrefix?: string;
  error?: string;
  title?: string;
  description?: ReactNode;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyText?: string;
  emptyIcon?: ReactNode;
  initialVisibleCount?: number;
  showIp?: boolean;
  lastUsedLabel?: string;
  formatLastUsedAt?: (value: string) => string;
  revokingSessionId?: string | null;
  isSigningOutAll?: boolean;
  onRetry?: () => Promise<void> | void;
  onRevoke?: (sessionId: string) => Promise<void> | void;
  onSignOutAll?: () => Promise<void> | void;
}>;

//===================================================================

function formatSessionDate(value: string): string {
  return formatDateTime(value) ?? 'Unknown';
}

//===================================================================

export function ActiveSessionsPanel({
  sessions,
  status,
  idPrefix = 'profile-sessions',
  error = '',
  title = 'Active sessions and devices',
  description = 'Review devices currently signed in to your account.',
  loadingLabel = 'Loading active sessions...',
  emptyTitle = 'No active sessions found',
  emptyText = 'Session data will appear here when you sign in.',
  emptyIcon = <MonitorSmartphone size={24} />,
  initialVisibleCount = 10,
  showIp = false,
  lastUsedLabel = 'Last used',
  formatLastUsedAt = formatSessionDate,
  revokingSessionId = null,
  isSigningOutAll = false,
  onRetry,
  onRevoke,
  onSignOutAll,
}: ActiveSessionsPanelProps) {
  const normalizedInitialVisibleCount = Math.max(1, initialVisibleCount);
  const [currentPage, setCurrentPage] = useState(1);

  const [pendingRevokeSessionId, setPendingRevokeSessionId] = useState<
    string | null
  >(null);

  const [isSignOutAllConfirmationOpen, setIsSignOutAllConfirmationOpen] =
    useState(false);

  const [isConfirmingRevoke, setIsConfirmingRevoke] = useState(false);
  const [isConfirmingSignOutAll, setIsConfirmingSignOutAll] = useState(false);

  const { activeSessions, pastSessions } = useMemo(() => {
    const now = Date.now();

    const activeSessions = sessions.filter(
      (session) => !session.revokedAt && Date.parse(session.expiresAt) > now
    );

    return {
      activeSessions,
      pastSessions: sessions.filter(
        (session) => !activeSessions.includes(session)
      ),
    };
  }, [sessions]);
  // One page holds at most ten rows across both active and expired sessions.
  // Active sessions are always first; history fills any remaining slots.
  const totalSessions = activeSessions.length + pastSessions.length;
  const totalPages = Math.ceil(totalSessions / normalizedInitialVisibleCount);
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const offset = (safePage - 1) * normalizedInitialVisibleCount;

  const visibleSessions = activeSessions.slice(
    offset,
    offset + normalizedInitialVisibleCount
  );

  const historyStart = Math.max(0, offset - activeSessions.length);

  const historyEnd = Math.max(
    0,
    offset + normalizedInitialVisibleCount - activeSessions.length
  );

  const visibleHistory = pastSessions.slice(historyStart, historyEnd);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(1, totalPages)));
  }, [totalPages]);

  const pendingRevokeSession = useMemo(
    () =>
      activeSessions.find((session) => session.id === pendingRevokeSessionId) ??
      null,
    [pendingRevokeSessionId, activeSessions]
  );

  const isPendingRevokeLoading = Boolean(
    isConfirmingRevoke ||
    (pendingRevokeSession && revokingSessionId === pendingRevokeSession.id)
  );

  const isSignOutAllConfirmationLoading =
    isConfirmingSignOutAll || isSigningOutAll;

  const handleConfirmRevoke = async () => {
    if (!pendingRevokeSession || !onRevoke || isPendingRevokeLoading) return;

    setIsConfirmingRevoke(true);

    try {
      await onRevoke(pendingRevokeSession.id);
    } finally {
      setIsConfirmingRevoke(false);
      setPendingRevokeSessionId(null);
    }
  };

  const handleConfirmSignOutAll = async () => {
    if (!onSignOutAll || isSignOutAllConfirmationLoading) return;

    setIsConfirmingSignOutAll(true);

    try {
      await onSignOutAll();
    } finally {
      setIsConfirmingSignOutAll(false);
      setIsSignOutAllConfirmationOpen(false);
    }
  };

  return (
    <section className={css.panel} aria-labelledby={`${idPrefix}-title`}>
      <div className={css.panelHeader}>
        <ProfileSectionHeader
          title={title}
          description={description}
          titleId={`${idPrefix}-title`}
          icon={<MonitorSmartphone size={22} />}
        />
      </div>

      {activeSessions.length > 0 && onSignOutAll ? (
        <Button
          className={css.panelAction}
          type="button"
          variant="secondary"
          size="sm"
          iconLeft={<LogOut size={18} aria-hidden="true" />}
          disabled={isSigningOutAll}
          isLoading={isSigningOutAll}
          loadingLabel="Signing out..."
          onClick={() => setIsSignOutAllConfirmationOpen(true)}
        >
          Sign out all devices
        </Button>
      ) : null}

      <div className={css.panelBody}>
        {status === 'loading' && sessions.length === 0 ? (
          <ProfileResourceState
            variant="loading"
            title="Loading active sessions"
            description={loadingLabel}
          />
        ) : null}

        {status === 'error' ? (
          <ProfileResourceState
            variant="error"
            title="Active sessions could not be loaded"
            description={error || 'Please try again.'}
            onRetry={onRetry}
          />
        ) : null}

        {visibleSessions.length > 0 ? (
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
                    {showIp ? (
                      <span>{session.ip || 'IP unavailable'}</span>
                    ) : null}
                    <span>
                      {lastUsedLabel}: {formatLastUsedAt(session.lastUsedAt)}
                    </span>
                  </div>

                  {session.isCurrent ? (
                    <span className={css.currentSession}>Current session</span>
                  ) : onRevoke ? (
                    <Button
                      className={css.sessionAction}
                      type="button"
                      variant="secondary"
                      size="sm"
                      iconLeft={<LogOut size={18} aria-hidden="true" />}
                      isLoading={revokingSessionId === session.id}
                      loadingLabel="Revoking..."
                      disabled={Boolean(
                        revokingSessionId && revokingSessionId !== session.id
                      )}
                      onClick={() => setPendingRevokeSessionId(session.id)}
                    >
                      Revoke
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : status === 'success' &&
          activeSessions.length === 0 &&
          pastSessions.length === 0 ? (
          <ProfileResourceState
            variant="empty"
            title={emptyTitle}
            description={emptyText}
            icon={emptyIcon}
          />
        ) : null}
        {status === 'success' && pastSessions.length > 0 ? (
          <section className={css.sessionsHistory} aria-label="Session history">
            <div className={css.sessionHistoryHeading}>
              <ProfileSectionHeader
                title="Session history"
                description="Previous sign-ins and signed-out devices (retained for up to 90 days after expiration)."
                icon={<History size={22} />}
              />

              <CountLabel
                shown={visibleHistory.length}
                total={pastSessions.length}
                label="sessions"
                fullWidthOnMobile
                className={css.sessionHistoryCount}
              />
            </div>

            <ul className={css.sessionsList}>
              {visibleHistory.map((session) => (
                <li className={css.sessionCard} key={session.id}>
                  <MonitorSmartphone size={22} aria-hidden="true" />
                  <div className={css.sessionInfo}>
                    <strong>
                      {session.deviceName ??
                        session.userAgent ??
                        'Unknown device'}
                    </strong>
                    {showIp ? (
                      <span>{session.ip || 'IP unavailable'}</span>
                    ) : null}
                    <span>
                      {session.revokedAt ? 'Signed out' : 'Expired'}:{' '}
                      {formatLastUsedAt(session.revokedAt ?? session.expiresAt)}
                    </span>
                    <span>
                      {lastUsedLabel}: {formatLastUsedAt(session.lastUsedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {status === 'success' && totalPages > 1 ? (
          <div className={css.sessionsPagination}>
            <LazyLoadButton
              visibleCount={Math.min(
                totalSessions,
                safePage * normalizedInitialVisibleCount
              )}
              totalCount={totalSessions}
              label="Show more sessions"
              iconRight={<ChevronDown size={18} aria-hidden="true" />}
              onLoadMore={() =>
                setCurrentPage((page) => Math.min(page + 1, totalPages))
              }
            />

            <PaginationView
              currentPage={safePage}
              totalPages={totalPages}
              ariaLabel="Sessions pagination"
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </div>

      <ConfirmationModal
        isOpen={Boolean(pendingRevokeSession)}
        title="Revoke this session?"
        eyebrow="Active sessions"
        description={
          pendingRevokeSession
            ? `The session on ${pendingRevokeSession.deviceName ?? pendingRevokeSession.userAgent ?? 'this device'} will be signed out.`
            : undefined
        }
        confirmLabel="Revoke session"
        cancelLabel="Keep session"
        confirmIconLeft={<LogOut size={17} aria-hidden="true" />}
        cancelIconLeft={<X size={17} aria-hidden="true" />}
        isLoading={isPendingRevokeLoading}
        closeOnBackdrop={!isPendingRevokeLoading}
        closeOnEscape={!isPendingRevokeLoading}
        onConfirm={() => void handleConfirmRevoke()}
        onCancel={() => {
          if (!isPendingRevokeLoading) setPendingRevokeSessionId(null);
        }}
      />

      <ConfirmationModal
        isOpen={isSignOutAllConfirmationOpen}
        title="Sign out all devices?"
        eyebrow="Active sessions"
        description="All active sessions, including this device, will be signed out. You will need to sign in again."
        confirmLabel="Sign out all devices"
        cancelLabel="Keep sessions"
        confirmIconLeft={<LogOut size={17} aria-hidden="true" />}
        cancelIconLeft={<X size={17} aria-hidden="true" />}
        isLoading={isSignOutAllConfirmationLoading}
        closeOnBackdrop={!isSignOutAllConfirmationLoading}
        closeOnEscape={!isSignOutAllConfirmationLoading}
        onConfirm={() => void handleConfirmSignOutAll()}
        onCancel={() => {
          if (!isSignOutAllConfirmationLoading)
            setIsSignOutAllConfirmationOpen(false);
        }}
      />
    </section>
  );
}
