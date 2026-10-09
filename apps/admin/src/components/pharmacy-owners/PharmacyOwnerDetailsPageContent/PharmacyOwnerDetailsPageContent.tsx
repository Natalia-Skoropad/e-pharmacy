'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  BadgeCheck,
  Ban,
  Building2,
  CircleCheckBig,
  CirclePlus,
  Clock3,
  Files,
  History,
  ImageOff,
  Mail,
  MessageSquareText,
  Phone,
  ShieldCheck,
  UserCog,
  UserRound,
} from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';

import {
  PHARMACY_STATUS_PRESENTATION,
  USER_STATUS_PRESENTATION,
} from '@e-pharmacy/config/presentation';

import type { AdminPharmacyOwnerDetail } from '@e-pharmacy/types/admin';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { LinkButton, Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { InfoTooltip, ReasonModal } from '@e-pharmacy/ui/overlays';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { Button } from '@e-pharmacy/ui/primitives';

import {
  StatsCard,
  StatsGrid,
  StatsLoadingSkeleton,
  StatusBadge,
} from '@e-pharmacy/ui/statistics';

import { NotFoundPage, StatusPageLayout } from '@e-pharmacy/ui/status-pages';
import { useToast } from '@e-pharmacy/ui/feedback';
import { formatDateTime } from '@e-pharmacy/utils/date';

import {
  getAdminPharmacyOwnerDetail,
  updateAdminPharmacyOwnerStatus,
} from '@/lib/api/browser/admin-pharmacy-owners.api';

import {
  buildAdminPharmacyOwnerDetailUrl,
  type AdminPharmacyOwnerDetailTab,
  type AdminPharmacyOwnerDetailUrlState,
  type AdminPharmacyOwnerPharmaciesUrlState,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import { dispatchAdminBreadcrumbLabel } from '@/lib/layout/breadcrumb-label-event';
import { canAdmin } from '@/lib/permissions/can-admin';
import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';
import { ADMIN_ROUTES } from '@/lib/routes';
import { requestPharmacyOwnerNavigationBadgeRefresh } from '@/lib/pharmacy-owners/pharmacy-owner-navigation-badge-refresh';
import { STATUS_PAGE_IMAGE } from '@/lib/status-pages/status-page-image';
import type { ActivityUrlState } from '@/lib/audit/admin-activity-url';
import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';

import { LinkedPharmaciesTab } from './LinkedPharmaciesTab';
import { OwnerActivityTab } from './OwnerActivityTab';
import { OwnerCommentsTab } from './OwnerCommentsTab';
import { OwnerDocumentsTab } from './OwnerDocumentsTab';

import css from './PharmacyOwnerDetailsPageContent.module.css';

//===================================================================

const OWNER_STATUS_REASON_MAX_LENGTH = 500;

const ZERO_TAB_COUNTS = {
  pharmacies: 0,
  documents: 0,
  comments: 0,
} as const;

//===================================================================

type PharmacyOwnerDetailsPageContentProps = Readonly<{
  ownerId: string;
  initialState: AdminPharmacyOwnerDetailUrlState;
  initialPharmaciesState: AdminPharmacyOwnerPharmaciesUrlState;
  initialActivityState?: ActivityUrlState;
}>;

type DetailLoadError = 'not-found' | 'forbidden' | 'error' | null;

type OwnerActionState = Readonly<{
  targetStatus: 'active' | 'blocked';
  reason: string;
  requestError: string;
}> | null;

//===================================================================

function buildReasonError(value: string): string {
  const reason = value.trim();
  if (!reason) return 'Reason is required.';

  if (reason.length > OWNER_STATUS_REASON_MAX_LENGTH) {
    return `Reason must be at most ${OWNER_STATUS_REASON_MAX_LENGTH} characters.`;
  }

  return '';
}

//===================================================================

function classifyLoadError(error: unknown): DetailLoadError {
  if (!isApiError(error)) return 'error';
  if (error.httpStatus === 404) return 'not-found';
  if (error.httpStatus === 403) return 'forbidden';
  return 'error';
}

//===================================================================

function getMutationErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return 'The owner account status could not be updated. Please try again.';
  }

  if (error.httpStatus === 409) {
    return 'This owner cannot be deactivated while at least one linked pharmacy has an active order. Finish or cancel those orders first.';
  }

  if (error.httpStatus === 403) {
    return 'You do not have permission to change pharmacy owner account status.';
  }

  if (error.httpStatus === 404) {
    return 'This pharmacy owner no longer exists.';
  }

  if (error.transportCode === 'NETWORK_ERROR') {
    return 'Could not reach the server. Check your connection and try again.';
  }

  if (error.transportCode === 'TIMEOUT') {
    return 'The request took too long. Please try again.';
  }

  return 'The owner account status could not be updated. Please try again.';
}

//===================================================================

function formatOwnerDate(value: string): string {
  return formatDateTime(value) ?? '—';
}

//===================================================================

function PharmacyOwnerDetailsPageContent({
  ownerId,
  initialState,
  initialPharmaciesState,
  initialActivityState,
}: PharmacyOwnerDetailsPageContentProps) {
  const router = useRouter();
  const toast = useToast();
  const { access } = useAdminAuthorization();
  const canEditOwner = canAdmin(access, ADMIN_PERMISSIONS.pharmacyOwners.edit);

  const [detail, setDetail] = useState<AdminPharmacyOwnerDetail | null>(null);
  const [loadError, setLoadError] = useState<DetailLoadError>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadVersion, setReloadVersion] = useState(0);

  const [activeTab, setActiveTab] = useState<AdminPharmacyOwnerDetailTab>(
    initialState.tab
  );

  const [actionState, setActionState] = useState<OwnerActionState>(null);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    setActiveTab(initialState.tab);
  }, [initialState.tab]);

  useEffect(() => {
    dispatchAdminBreadcrumbLabel(`Owner #${ownerId}`);
  }, [ownerId]);

  useEffect(() => {
    if (detail?.name) dispatchAdminBreadcrumbLabel(detail.name);
  }, [detail?.name]);

  const loadDetail = useCallback(
    async (signal?: AbortSignal): Promise<AdminPharmacyOwnerDetail> => {
      return getAdminPharmacyOwnerDetail(ownerId, { signal });
    },
    [ownerId]
  );

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);

    void loadDetail(controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setDetail(response);
        setIsLoading(false);
      })

      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setDetail(null);
        setLoadError(classifyLoadError(error));
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [loadDetail, reloadVersion]);

  const tabCounts = detail?.tabCounts ?? ZERO_TAB_COUNTS;

  const updateTabCount = useCallback(
    (key: 'documents' | 'comments', count: number) => {
      setDetail((current) =>
        current
          ? {
              ...current,
              tabCounts: {
                ...current.tabCounts,
                [key]: count,
              },
            }
          : current
      );
    },
    []
  );

  const updateDocumentsCount = useCallback(
    (count: number) => updateTabCount('documents', count),
    [updateTabCount]
  );

  const updateCommentsCount = useCallback(
    (count: number) => updateTabCount('comments', count),
    [updateTabCount]
  );

  const tabs = useMemo<Array<TabItem<AdminPharmacyOwnerDetailTab>>>(() => {
    return [
      {
        value: 'personal',
        label: 'Personal information',
        icon: <UserRound size={17} aria-hidden="true" />,
      },
      {
        value: 'pharmacies',
        label: `Pharmacies (${tabCounts.pharmacies})`,
        icon: <Building2 size={17} aria-hidden="true" />,
      },
      {
        value: 'documents',
        label: `Documents (${tabCounts.documents})`,
        icon: <Files size={17} aria-hidden="true" />,
      },
      {
        value: 'comments',
        label: `Comments (${tabCounts.comments})`,
        icon: <MessageSquareText size={17} aria-hidden="true" />,
      },
      {
        value: 'activity',
        label: 'Activity history',
        icon: <History size={17} aria-hidden="true" />,
      },
    ];
  }, [tabCounts.comments, tabCounts.documents, tabCounts.pharmacies]);

  const handleTabChange = (nextTab: AdminPharmacyOwnerDetailTab) => {
    setActiveTab(nextTab);
    router.replace(
      buildAdminPharmacyOwnerDetailUrl(ownerId, { tab: nextTab }),
      {
        scroll: false,
      }
    );
  };

  const openStatusAction = () => {
    if (!detail || !canEditOwner) return;

    setActionState({
      targetStatus: detail.status === 'blocked' ? 'active' : 'blocked',
      reason: '',
      requestError: '',
    });
  };

  const closeStatusAction = () => {
    if (!isMutating) setActionState(null);
  };

  const handleStatusMutation = async () => {
    if (!detail || !actionState || isMutating) return;

    const reasonError = buildReasonError(actionState.reason);
    if (reasonError) return;

    setIsMutating(true);
    setActionState((current) =>
      current ? { ...current, requestError: '' } : current
    );

    try {
      await updateAdminPharmacyOwnerStatus(ownerId, {
        status: actionState.targetStatus,
        reason: actionState.reason.trim(),
      });

      const refreshed = await loadDetail();
      setDetail(refreshed);
      requestPharmacyOwnerNavigationBadgeRefresh();
      setLoadError(null);
      setActionState(null);

      toast.success(
        actionState.targetStatus === 'blocked'
          ? 'Pharmacy owner was deactivated.'
          : 'Pharmacy owner was reactivated.'
      );
    } catch (error: unknown) {
      setActionState((current) =>
        current
          ? { ...current, requestError: getMutationErrorMessage(error) }
          : current
      );
    } finally {
      setIsMutating(false);
    }
  };

  if (!isLoading && loadError === 'not-found') {
    return (
      <NotFoundPage
        title="Pharmacy owner not found"
        description="This owner does not exist, was removed, or the link is invalid."
        homeHref={ADMIN_ROUTES.PHARMACY_OWNERS}
        homeLabel="Back to pharmacy owners"
        variant="brand"
        landmark="main"
        image={STATUS_PAGE_IMAGE}
      />
    );
  }

  if (!isLoading && loadError === 'forbidden') {
    return (
      <StatusPageLayout
        eyebrow="Permission required"
        title="You do not have access to this pharmacy owner"
        description="Your current admin permissions do not allow this owner record to be viewed."
        variant="brand"
        landmark="main"
        image={STATUS_PAGE_IMAGE}
        actions={
          <LinkButton href={ADMIN_ROUTES.PHARMACY_OWNERS} size="lg">
            Back to pharmacy owners
          </LinkButton>
        }
      />
    );
  }

  if (!isLoading && loadError === 'error') {
    return (
      <main className={css.page} aria-label="Pharmacy owner details error">
        <section className={css.card}>
          <ProfileResourceState
            variant="error"
            title="Pharmacy owner details could not be loaded"
            description="The pharmacy owner may no longer be available, or the profile could not be loaded right now."
            retryLabel="Try again"
            sideActionOnDesktop
            onRetry={() => setReloadVersion((version) => version + 1)}
          />
        </section>
      </main>
    );
  }

  const statistics = detail?.pharmacyStatistics;
  const isDeactivateAction = detail ? detail.status !== 'blocked' : true;
  const actionTarget = actionState?.targetStatus;
  const actionReasonError = actionState
    ? buildReasonError(actionState.reason)
    : '';

  return (
    <main className={css.page} aria-labelledby="pharmacy-owner-details-title">
      <section className={css.card}>
        <div className={css.headerStack}>
          <PageHeader
            className={css.ownerPageHeader}
            title={
              <span className={css.titleWithHelp}>
                {detail?.name ?? 'Pharmacy owner'}
                <InfoTooltip
                  label="About pharmacy owner details"
                  title="Pharmacy owner details"
                  icon={<UserCog size={20} aria-hidden="true" />}
                  escapeOverflow
                  items={[
                    {
                      title: 'Owner account status',
                      description:
                        'The account status controls whether the owner can access the cabinet. Activate or Deactivate changes this owner-level access state.',
                      icon: <ShieldCheck size={17} aria-hidden="true" />,
                    },
                    {
                      title: 'Linked pharmacy overview',
                      description:
                        'The colored cards summarize linked pharmacies by their current moderation status. These are pharmacy-level values, not a second owner account status.',
                      icon: <Building2 size={17} aria-hidden="true" />,
                    },
                  ]}
                />
              </span>
            }
            titleId="pharmacy-owner-details-title"
            icon={<UserCog size={23} aria-hidden="true" />}
            actions={
              detail && canEditOwner ? (
                <div className={css.ownerStatusAction}>
                  <Button
                    type="button"
                    size="sm"
                    className={
                      isDeactivateAction ? css.dangerButton : undefined
                    }
                    iconLeft={
                      isDeactivateAction ? (
                        <Ban size={17} aria-hidden="true" />
                      ) : (
                        <ShieldCheck size={17} aria-hidden="true" />
                      )
                    }
                    onClick={openStatusAction}
                  >
                    {isDeactivateAction ? 'Deactivate owner' : 'Activate owner'}
                  </Button>
                </div>
              ) : undefined
            }
          />

          <div className={css.statisticsSection}>
            {statistics ? (
              <StatsGrid
                className={css.statistics}
                ariaLabel="Linked pharmacy status statistics"
                columns={5}
                tabletColumns={3}
              >
                <StatsCard
                  title={PHARMACY_STATUS_PRESENTATION.new.label}
                  value={statistics.new}
                  tone="blue"
                  icon={<CirclePlus size={26} aria-hidden="true" />}
                />
                <StatsCard
                  title={PHARMACY_STATUS_PRESENTATION.on_verification.label}
                  value={statistics.onVerification}
                  tone="purple"
                  icon={<BadgeCheck size={26} aria-hidden="true" />}
                />
                <StatsCard
                  title={PHARMACY_STATUS_PRESENTATION.on_moderation.label}
                  value={statistics.onModeration}
                  tone="orange"
                  icon={<Clock3 size={26} aria-hidden="true" />}
                />
                <StatsCard
                  title={PHARMACY_STATUS_PRESENTATION.active.label}
                  value={statistics.active}
                  tone="green"
                  icon={<ShieldCheck size={26} aria-hidden="true" />}
                />
                <StatsCard
                  title={PHARMACY_STATUS_PRESENTATION.blocked.label}
                  value={statistics.blocked}
                  tone="red"
                  icon={<Ban size={26} aria-hidden="true" />}
                />
              </StatsGrid>
            ) : (
              <StatsLoadingSkeleton
                count={5}
                columns={5}
                tabletColumns={3}
                label="Loading pharmacy statistics"
              />
            )}
          </div>
        </div>
      </section>

      <section className={css.card}>
        <div className={css.tabsSection}>
          <Tabs
            idBase="pharmacy-owner-details"
            items={tabs}
            activeValue={activeTab}
            ariaLabel="Pharmacy owner details tabs"
            mobileVisibleCount={1}
            tabletVisibleCount={3}
            onChange={handleTabChange}
          />

          {activeTab === 'personal' ? (
            <div className={css.personalTabStack}>
              <ProfileSectionHeader
                title="Personal information"
                titleId="owner-personal-information-title"
                description="Review the pharmacy owner's account identity and read-only contact details."
                icon={<UserRound size={22} />}
              />

              {isLoading || !detail ? (
                <ProfileResourceState
                  variant="loading"
                  title="Loading personal information"
                  description="Please wait while the pharmacy owner details are loaded."
                />
              ) : (
                <div className={css.detailsGrid}>
                  <section className={css.visualCard} aria-label="Owner photo">
                    {detail.pictureUrl ? (
                      <span className={css.imageFrame}>
                        <ShimmerImage
                          src={detail.pictureUrl}
                          alt={detail.name}
                          className={css.ownerImage}
                          sizes="(max-width: 767px) calc(100vw - 72px), (max-width: 1439px) 360px, 44vw"
                          unoptimized
                        />
                      </span>
                    ) : (
                      <div className={css.imagePlaceholder}>
                        <div
                          className={css.imagePlaceholderVisual}
                          aria-hidden="true"
                        >
                          <span className={css.imagePlaceholderIcon}>
                            <UserRound size={58} />
                          </span>
                          <span className={css.imagePlaceholderBadge}>
                            <ImageOff size={16} />
                          </span>
                        </div>

                        <div className={css.imagePlaceholderCopy}>
                          <strong>No profile photo yet</strong>
                          <span>
                            The pharmacy owner has not uploaded a profile photo.
                          </span>
                        </div>
                      </div>
                    )}
                  </section>

                  <section
                    className={css.detailsCard}
                    aria-labelledby="owner-personal-information-title"
                  >
                    <dl className={css.detailsList}>
                      <div>
                        <dt>Account status</dt>
                        <dd>
                          <StatusBadge
                            {...USER_STATUS_PRESENTATION[detail.status]}
                          />
                        </dd>
                      </div>
                      <div>
                        <dt>Owner ID</dt>
                        <dd>{detail.id}</dd>
                      </div>
                      <div>
                        <dt>Name</dt>
                        <dd>{detail.name}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>
                          <a href={`mailto:${detail.email}`}>
                            <Mail size={17} aria-hidden="true" />
                            {detail.email}
                          </a>
                        </dd>
                      </div>
                      <div>
                        <dt>Phone</dt>
                        <dd>
                          <a href={`tel:${detail.phone}`}>
                            <Phone size={17} aria-hidden="true" />
                            {detail.phone}
                          </a>
                        </dd>
                      </div>
                      <div>
                        <dt>Registration date</dt>
                        <dd>
                          <span className={css.detailValueWithIcon}>
                            <CircleCheckBig size={17} aria-hidden="true" />
                            <time dateTime={detail.registeredAt}>
                              {formatOwnerDate(detail.registeredAt)}
                            </time>
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Last personal data change</dt>
                        <dd>
                          <span className={css.detailValueWithIcon}>
                            <Clock3 size={17} aria-hidden="true" />
                            <time dateTime={detail.lastPersonalDataUpdateAt}>
                              {formatOwnerDate(detail.lastPersonalDataUpdateAt)}
                            </time>
                          </span>
                        </dd>
                      </div>
                    </dl>

                    {detail.status === 'blocked' ? (
                      <div
                        className={`${css.statusSummary} ${css.statusSummaryBlocked}`}
                      >
                        <strong>Blocked owner</strong>
                        <p>
                          {detail.statusReason ||
                            'The owner account is blocked and cannot access pharmacy management.'}
                        </p>
                      </div>
                    ) : detail.status === 'active' ? (
                      <div
                        className={`${css.statusSummary} ${css.statusSummaryActive}`}
                      >
                        <strong>Active owner</strong>
                        <p>
                          The owner account is active and can access pharmacy
                          management without account restrictions.
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`${css.statusSummary} ${css.statusSummaryNew}`}
                      >
                        <strong>New owner</strong>
                        <p>
                          The account is waiting for the first linked pharmacy
                          to complete verification or moderation before it
                          becomes active.
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          ) : activeTab === 'pharmacies' ? (
            <LinkedPharmaciesTab
              ownerId={ownerId}
              initialState={initialPharmaciesState}
            />
          ) : activeTab === 'documents' ? (
            <OwnerDocumentsTab
              ownerId={ownerId}
              onCountChange={updateDocumentsCount}
            />
          ) : activeTab === 'comments' ? (
            <OwnerCommentsTab
              ownerId={ownerId}
              canManage={canEditOwner}
              onCountChange={updateCommentsCount}
            />
          ) : (
            <OwnerActivityTab
              ownerId={ownerId}
              initialState={initialActivityState}
            />
          )}
        </div>
      </section>

      {actionState && detail ? (
        <ReasonModal
          isOpen
          eyebrow={
            actionTarget === 'blocked' ? 'Deactivate owner' : 'Activate owner'
          }
          title={
            actionTarget === 'blocked'
              ? 'Explain the deactivation reason'
              : 'Explain the reactivation reason'
          }
          description={
            actionTarget === 'blocked'
              ? 'Deactivation signs the owner out and blocks every linked pharmacy. The action is rejected while a linked pharmacy has an active order.'
              : 'Reactivation restores the owner account only. Linked pharmacies remain blocked and must be handled separately in pharmacy moderation.'
          }
          value={actionState.reason}
          fieldName="pharmacyOwnerStatusReason"
          fieldLabel={
            actionTarget === 'blocked'
              ? 'Deactivation reason'
              : 'Reactivation reason'
          }
          placeholder={
            actionTarget === 'blocked'
              ? 'Describe why this owner account must be deactivated...'
              : 'Describe why this owner account can be reactivated...'
          }
          confirmLabel={
            actionTarget === 'blocked' ? 'Deactivate owner' : 'Activate owner'
          }
          cancelLabel="Cancel"
          maxLength={OWNER_STATUS_REASON_MAX_LENGTH}
          error={actionReasonError}
          requestError={actionState.requestError}
          isLoading={isMutating}
          tone={actionTarget === 'blocked' ? 'danger' : 'accent'}
          onValueChange={(reason) =>
            setActionState((current) =>
              current ? { ...current, reason, requestError: '' } : current
            )
          }
          onCancel={closeStatusAction}
          onConfirm={() => void handleStatusMutation()}
        />
      ) : null}
    </main>
  );
}

export default PharmacyOwnerDetailsPageContent;
export { PharmacyOwnerDetailsPageContent };
