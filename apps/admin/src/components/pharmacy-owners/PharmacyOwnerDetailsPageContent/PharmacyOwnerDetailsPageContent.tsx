'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Ban,
  Building2,
  CircleCheckBig,
  Clock3,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  UsersRound,
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
import { Button, LoadingSpinner } from '@e-pharmacy/ui/primitives';
import { StatsCard, StatsGrid, StatusBadge } from '@e-pharmacy/ui/statistics';

import {
  ErrorPage,
  NotFoundPage,
  StatusPageLayout,
} from '@e-pharmacy/ui/status-pages';

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
} from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import { canAdmin } from '@/lib/permissions/can-admin';
import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';
import { ADMIN_ROUTES } from '@/lib/routes';
import { STATUS_PAGE_IMAGE } from '@/lib/status-pages/status-page-image';
import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';

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

  const tabs = useMemo<Array<TabItem<AdminPharmacyOwnerDetailTab>>>(() => {
    return [
      { value: 'personal', label: 'Personal information' },
      { value: 'pharmacies', label: `Pharmacies (${tabCounts.pharmacies})` },
      { value: 'documents', label: `Documents (${tabCounts.documents})` },
      { value: 'comments', label: `Comments (${tabCounts.comments})` },
      { value: 'activity', label: 'Activity history' },
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
      <ErrorPage
        title="Pharmacy owner is temporarily unavailable"
        description="We could not load this owner record. Retry the request or return to the owners list."
        retryLabel="Retry owner details"
        homeHref={ADMIN_ROUTES.PHARMACY_OWNERS}
        homeLabel="Back to pharmacy owners"
        variant="brand"
        landmark="main"
        image={STATUS_PAGE_IMAGE}
        onRetry={() => setReloadVersion((version) => version + 1)}
      />
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
            title={
              <span className={css.titleWithHelp}>
                {detail?.name ?? 'Pharmacy owner'}
                <InfoTooltip
                  label="About pharmacy owner details"
                  title="Pharmacy owner details"
                  items={[
                    {
                      title: 'Owner account status',
                      description:
                        'New, Active, or Blocked controls the owner account access and is managed separately from pharmacy moderation.',
                    },
                    {
                      title: 'Pharmacy status statistics',
                      description:
                        'These counters describe moderation states of pharmacies linked to this owner, not the owner account itself.',
                    },
                  ]}
                />
              </span>
            }
            titleId="pharmacy-owner-details-title"
            icon={<UsersRound size={23} aria-hidden="true" />}
            actions={
              detail && canEditOwner ? (
                <Button
                  type="button"
                  size="sm"
                  className={isDeactivateAction ? css.dangerButton : undefined}
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
              ) : undefined
            }
          />

          <div className={css.accountStatusRow}>
            <div className={css.accountStatusCopy}>
              <span className={css.eyebrow}>Owner account status</span>
              <div className={css.accountStatusValue}>
                {detail ? (
                  <StatusBadge {...USER_STATUS_PRESENTATION[detail.status]} />
                ) : (
                  <span className={css.loadingText}>Loading status...</span>
                )}
              </div>
            </div>

            <div className={css.ownerIdBlock}>
              <span>Owner ID</span>
              <strong>{ownerId}</strong>
            </div>
          </div>

          {detail?.status === 'blocked' && detail.statusReason ? (
            <div className={css.statusReason}>
              <strong>Deactivation reason</strong>
              <p>{detail.statusReason}</p>
            </div>
          ) : null}

          <div className={css.statisticsSection}>
            <div className={css.sectionHeading}>
              <div>
                <p className={css.eyebrow}>Linked pharmacies</p>
                <h2>Pharmacy status statistics</h2>
              </div>

              <p>
                These are pharmacy moderation statuses. They are separate from
                the owner account status above.
              </p>
            </div>

            {statistics ? (
              <StatsGrid
                className={css.statistics}
                ariaLabel="Linked pharmacy status statistics"
                columns={6}
                tabletColumns={3}
              >
                <StatsCard
                  title="All"
                  value={statistics.all}
                  tone="neutral"
                  icon={<Building2 size={20} aria-hidden="true" />}
                />
                <StatsCard
                  title={PHARMACY_STATUS_PRESENTATION.new.label}
                  value={statistics.new}
                  tone="blue"
                  status={PHARMACY_STATUS_PRESENTATION.new}
                />
                <StatsCard
                  title={PHARMACY_STATUS_PRESENTATION.on_verification.label}
                  value={statistics.onVerification}
                  tone="yellow"
                  status={PHARMACY_STATUS_PRESENTATION.on_verification}
                />
                <StatsCard
                  title={PHARMACY_STATUS_PRESENTATION.on_moderation.label}
                  value={statistics.onModeration}
                  tone="accent"
                  status={PHARMACY_STATUS_PRESENTATION.on_moderation}
                />
                <StatsCard
                  title={PHARMACY_STATUS_PRESENTATION.active.label}
                  value={statistics.active}
                  tone="green"
                  status={PHARMACY_STATUS_PRESENTATION.active}
                />
                <StatsCard
                  title={PHARMACY_STATUS_PRESENTATION.blocked.label}
                  value={statistics.blocked}
                  tone="red"
                  status={PHARMACY_STATUS_PRESENTATION.blocked}
                />
              </StatsGrid>
            ) : (
              <div className={css.statisticsLoading} role="status">
                <LoadingSpinner label="Loading pharmacy statistics..." />
              </div>
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
            isLoading || !detail ? (
              <div className={css.personalLoading} role="status">
                <LoadingSpinner label="Loading owner information..." />
              </div>
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
                    <div className={css.imagePlaceholder} aria-hidden="true">
                      <UserRound size={72} />
                    </div>
                  )}
                </section>

                <section className={css.detailsCard}>
                  <h2>Personal information</h2>

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
                      <dt>Address</dt>
                      <dd>
                        {detail.address ? (
                          <span className={css.detailValueWithIcon}>
                            <MapPin size={17} aria-hidden="true" />
                            {detail.address}
                          </span>
                        ) : (
                          '—'
                        )}
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
                </section>
              </div>
            )
          ) : (
            <section className={css.futureTabState} aria-live="polite">
              <FileCheck2 size={28} aria-hidden="true" />
              <div>
                <h2>{tabs.find((tab) => tab.value === activeTab)?.label}</h2>
                <p>
                  This section is reserved in the owner detail layout. Its data
                  view is not connected in the current implementation yet.
                </p>
              </div>
            </section>
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
