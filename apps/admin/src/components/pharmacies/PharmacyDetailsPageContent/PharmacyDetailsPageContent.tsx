'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  Activity,
  Building2,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileText,
  History,
  MessageSquareText,
  Package,
  PackageSearch,
  ShoppingBag,
  Star,
  UsersRound,
  UserRound,
  Wallet,
} from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import { formatMoney } from '@e-pharmacy/utils';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { LinkButton, Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import {
  StatsCard,
  StatsGrid,
  StatsLoadingSkeleton,
  StatusBadge,
} from '@e-pharmacy/ui/statistics';

import { NotFoundPage, StatusPageLayout } from '@e-pharmacy/ui/status-pages';

import { getAdminPharmacyDetail } from '@/lib/api/browser/admin-pharmacy-detail.api';
import { dispatchAdminBreadcrumbLabel } from '@/lib/layout/breadcrumb-label-event';

import {
  buildAdminPharmacyDetailUrl,
  type AdminPharmacyDetailTab,
} from '@/lib/pharmacies/admin-pharmacy-url';

import { buildAdminPharmacyOwnerDetailUrl } from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';
import { canAdmin } from '@/lib/permissions/can-admin';
import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';
import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';
import { ADMIN_ROUTES } from '@/lib/routes';
import { STATUS_PAGE_IMAGE } from '@/lib/status-pages/status-page-image';
import type { ActivityUrlState } from '@/lib/audit/admin-activity-url';

import { PharmacyInformationTab } from './PharmacyInformationTab';
import { PharmacyAboutPaymentTab } from './PharmacyAboutPaymentTab';
import { PharmacyModerationActions } from './PharmacyModerationActions';
import { PharmacyDocumentsTab } from './PharmacyDocumentsTab';
import { PharmacyCommentsTab } from './PharmacyCommentsTab';
import { PharmacyActivityTab } from './PharmacyActivityTab';

import css from './PharmacyDetailsPageContent.module.css';

//===================================================================

type DetailError = 'not-found' | 'forbidden' | 'error';

type DetailResult = Readonly<{
  pharmacyId: string;
  retry: number;
  detail: AdminPharmacyDetail | null;
  error: DetailError | null;
}>;

type PharmacyDetailsPageContentProps = Readonly<{
  pharmacyId: string;
  activeTab: AdminPharmacyDetailTab;
  initialActivityState?: ActivityUrlState;
}>;

//===================================================================

function classifyLoadError(error: unknown): DetailError {
  if (isApiError(error)) {
    if (error.httpStatus === 404) return 'not-found';
    if (error.httpStatus === 403) return 'forbidden';
  }

  return 'error';
}

//===================================================================

const TAB_ITEMS: TabItem<AdminPharmacyDetailTab>[] = [
  {
    value: 'information',
    label: 'Pharmacy information',
    icon: <Building2 size={17} />,
  },
  {
    value: 'about-payment',
    label: 'About & payment',
    icon: <CreditCard size={17} />,
  },
  { value: 'documents', label: 'Documents', icon: <FileText size={17} /> },
  {
    value: 'comments',
    label: 'Comments',
    icon: <MessageSquareText size={17} />,
  },
  { value: 'reviews', label: 'Reviews', icon: <Star size={17} /> },
  { value: 'orders', label: 'Orders', icon: <ShoppingBag size={17} /> },
  { value: 'clients', label: 'Clients', icon: <UsersRound size={17} /> },
  { value: 'products', label: 'Products', icon: <Package size={17} /> },
  {
    value: 'product-requests',
    label: 'Product requests',
    icon: <PackageSearch size={17} />,
  },
  { value: 'activity', label: 'Activity history', icon: <History size={17} /> },
];

//===================================================================

/** Future panels mount one at a time and must not fetch inactive resources. */
const TAB_DESCRIPTIONS: Record<AdminPharmacyDetailTab, string> = {
  information:
    'Review published pharmacy details separately from submitted changes awaiting moderation.',
  'about-payment':
    'Review the approved description and private payment data separately from any submitted changes.',

  documents:
    'Review published and pending pharmacy verification files. Documents cannot be changed from Admin.',

  comments:
    'Private working notes for Admin employees only, invisible to pharmacy owners and staff.',

  reviews:
    'Pharmacy reviews will be available when the reviews module is ready.',
  orders: 'Pharmacy orders will be available when the orders module is ready.',

  clients:
    'Pharmacy clients will be available when the clients module is ready.',

  products:
    'Pharmacy products will be available when the products module is ready.',
  'product-requests':
    'Product requests will be available when the product requests module is ready.',

  activity:
    'Review the exact audit trail of this pharmacy, including moderation and internal Admin comment events.',
};

//===================================================================

/** These are deliberately informational: no records or counts are fabricated. */
const DEFERRED_TABS: Partial<
  Record<
    AdminPharmacyDetailTab,
    { title: string; description: string; icon: ReactNode }
  >
> = {
  reviews: {
    title: 'Pharmacy reviews are not connected yet',
    description:
      'Verified customer feedback and review moderation for this pharmacy will be available after the Reviews module is integrated. The rating summary above is already available; no review list has been requested.',
    icon: <Star size={30} aria-hidden="true" />,
  },

  orders: {
    title: 'Pharmacy orders are not connected yet',
    description:
      'The Orders module will show orders placed with this pharmacy, their statuses and history. The successful-order summary above does not require loading individual orders.',
    icon: <ShoppingBag size={30} aria-hidden="true" />,
  },

  clients: {
    title: 'Pharmacy clients are not connected yet',
    description:
      'The Clients module will provide the customer list and related pharmacy activity. The active-client summary above is available without requesting personal customer records.',
    icon: <UsersRound size={30} aria-hidden="true" />,
  },

  products: {
    title: 'Pharmacy products are not connected yet',
    description:
      'The Products module will show this pharmacy’s assortment and its listings when integrated. Product records are not loaded on this page yet.',
    icon: <Package size={30} aria-hidden="true" />,
  },

  'product-requests': {
    title: 'Product requests are not connected yet',
    description:
      'Requests to add or update products from this pharmacy will appear here after the Product requests module is connected. No requests have been queried.',
    icon: <PackageSearch size={30} aria-hidden="true" />,
  },
};

//===================================================================

export function PharmacyDetailsPageContent({
  pharmacyId,
  activeTab,
  initialActivityState,
}: PharmacyDetailsPageContentProps) {
  const router = useRouter();
  const { access } = useAdminAuthorization();
  const canViewOwner = canAdmin(access, ADMIN_PERMISSIONS.pharmacyOwners.view);
  const canModerate = canAdmin(access, ADMIN_PERMISSIONS.pharmacies.moderate);
  const canEditPharmacy = canAdmin(access, ADMIN_PERMISSIONS.pharmacies.edit);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<DetailResult | null>(null);

  const isCurrent =
    result?.pharmacyId === pharmacyId && result?.retry === retry;

  const detail = isCurrent ? result?.detail : null;
  const pharmacyName = detail?.current.name;
  const error = isCurrent ? result?.error : null;
  const isLoading = !isCurrent || (!detail && !error);

  useEffect(() => {
    dispatchAdminBreadcrumbLabel(`Pharmacy #${pharmacyId}`);
  }, [pharmacyId]);

  useEffect(() => {
    if (pharmacyName) {
      dispatchAdminBreadcrumbLabel(pharmacyName);
    }
  }, [pharmacyName]);

  useEffect(() => {
    const controller = new AbortController();
    // Result keys keep previous pharmacy/retry data hidden while loading.
    void getAdminPharmacyDetail(pharmacyId, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) {
          setResult({ pharmacyId, retry, detail: response, error: null });
        }
      })

      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            pharmacyId,
            retry,
            detail: null,
            error: classifyLoadError(cause),
          });
        }
      });

    return () => controller.abort();
  }, [pharmacyId, retry]);

  const selectedTab =
    TAB_ITEMS.find((tab) => tab.value === activeTab) ?? TAB_ITEMS[0];

  const deferredTab = DEFERRED_TABS[activeTab];

  if (error === 'not-found') {
    return (
      <NotFoundPage
        title="Pharmacy not found"
        description="This pharmacy does not exist, was removed, or the link is no longer valid."
        homeHref={ADMIN_ROUTES.PHARMACIES}
        homeLabel="Back to pharmacies"
        variant="brand"
        landmark="main"
        image={STATUS_PAGE_IMAGE}
      />
    );
  }

  if (error === 'forbidden') {
    return (
      <StatusPageLayout
        eyebrow="Permission required"
        title="You do not have access to this pharmacy"
        description="Your current admin permissions do not allow this pharmacy to be viewed."
        variant="brand"
        landmark="main"
        image={STATUS_PAGE_IMAGE}
        actions={
          <LinkButton href={ADMIN_ROUTES.PHARMACIES} size="lg">
            Back to pharmacies
          </LinkButton>
        }
      />
    );
  }

  if (error === 'error') {
    return (
      <main className={css.page} aria-label="Pharmacy details error">
        <section className={css.card}>
          <ProfileResourceState
            variant="error"
            title="Pharmacy details could not be loaded"
            description="The pharmacy may be temporarily unavailable. Please try again."
            retryLabel="Try again"
            sideActionOnDesktop
            onRetry={() => setRetry((value) => value + 1)}
          />
        </section>
      </main>
    );
  }

  const metrics = detail?.metrics;
  const owner = detail?.owner;

  return (
    <main className={css.page} aria-labelledby="pharmacy-details-title">
      <section className={css.card}>
        <div className={css.headerStack}>
          <PageHeader
            className={css.pageHeader}
            title={
              <span className={css.titleWithHelp}>
                {detail?.current.name ?? 'Pharmacy'}
                <InfoTooltip
                  label="About pharmacy details"
                  title="Pharmacy details"
                  icon={<CircleHelp size={20} aria-hidden="true" />}
                  escapeOverflow
                  items={[
                    {
                      title: 'Current pharmacy status',
                      description:
                        'This badge represents the pharmacy moderation status, not the owner account status.',
                      icon: <Building2 size={17} aria-hidden="true" />,
                    },
                    {
                      title: 'Pharmacy overview',
                      description:
                        'The four cards summarize active clients, successful orders, successful revenue, and verified reviews for this pharmacy.',
                      icon: <ClipboardList size={17} aria-hidden="true" />,
                    },
                    {
                      title: 'Pharmacy data and history',
                      description:
                        'The selected tab is reflected in the URL. Additional sections become available individually, without loading unrelated tabs.',
                      icon: <Activity size={17} aria-hidden="true" />,
                    },
                  ]}
                />
              </span>
            }
            titleId="pharmacy-details-title"
            icon={<Building2 size={23} aria-hidden="true" />}
            actions={
              detail && canModerate ? (
                <PharmacyModerationActions
                  detail={detail}
                  onRefresh={() => setRetry((version) => version + 1)}
                  onDetailRefreshed={(fresh) =>
                    setResult({ pharmacyId, retry, detail: fresh, error: null })
                  }
                />
              ) : undefined
            }
          />

          <div className={css.detailMeta}>
            {detail ? (
              <>
                <StatusBadge {...PHARMACY_STATUS_PRESENTATION[detail.status]} />
                <span className={css.pharmacyId}>ID: {detail.id}</span>
                {owner && canViewOwner ? (
                  <LinkButton
                    href={buildAdminPharmacyOwnerDetailUrl(owner.id)}
                    size="sm"
                    variant="secondary"
                  >
                    <UserRound size={16} aria-hidden="true" />
                    {owner.name}
                  </LinkButton>
                ) : (
                  <span className={css.muted}>
                    {owner?.name ?? 'No linked owner'}
                  </span>
                )}
              </>
            ) : (
              <span className={css.muted} role="status">
                Loading pharmacy status and owner…
              </span>
            )}
          </div>

          {metrics ? (
            <StatsGrid
              columns={4}
              tabletColumns={2}
              ariaLabel="Pharmacy performance summary"
            >
              <StatsCard
                title="Active clients"
                value={metrics.activeClientsCount}
                tone="blue"
                icon={<UsersRound size={26} aria-hidden="true" />}
              />

              <StatsCard
                title="Successful orders"
                value={metrics.successfulOrdersCount}
                tone="green"
                icon={<ShoppingBag size={26} aria-hidden="true" />}
              />

              <StatsCard
                title="Successful revenue"
                value={formatMoney(metrics.successfulRevenue) ?? '—'}
                tone="purple"
                icon={<Wallet size={26} aria-hidden="true" />}
              />

              <StatsCard
                title="Rating / reviews"
                value={
                  metrics.reviewsCount
                    ? metrics.rating.toFixed(1)
                    : 'No reviews'
                }
                meta={`${metrics.reviewsCount} reviews`}
                tone="orange"
                icon={<Star size={26} aria-hidden="true" />}
              />
            </StatsGrid>
          ) : (
            <StatsLoadingSkeleton
              count={4}
              columns={4}
              tabletColumns={2}
              label="Loading pharmacy performance summary"
            />
          )}
        </div>
      </section>

      <section className={css.card} aria-label="Pharmacy detail sections">
        <div className={css.tabsStack}>
          <Tabs
            idBase="pharmacy-details"
            items={TAB_ITEMS}
            ariaLabel="Pharmacy details tabs"
            activeValue={activeTab}
            mobileVisibleCount={1}
            tabletVisibleCount={3}
            onChange={(tab) => {
              if (tab !== activeTab) {
                router.replace(buildAdminPharmacyDetailUrl(pharmacyId, tab), {
                  scroll: false,
                });
              }
            }}
          />

          {/* Render only the selected panel: no hidden/mounted inactive data tabs. */}
          <section
            id={`pharmacy-details-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`pharmacy-details-tab-${activeTab}`}
            className={css.tabPanel}
            tabIndex={0}
          >
            {activeTab !== 'documents' &&
            activeTab !== 'comments' &&
            activeTab !== 'activity' ? (
              <ProfileSectionHeader
                title={selectedTab.label}
                description={TAB_DESCRIPTIONS[activeTab]}
                icon={selectedTab.icon ?? <Building2 size={22} />}
              />
            ) : null}
            {isLoading ? (
              <ProfileResourceState
                variant="loading"
                title="Loading pharmacy details"
                description="The pharmacy overview is being loaded."
              />
            ) : activeTab === 'information' && detail ? (
              <PharmacyInformationTab
                detail={detail}
                canViewOwner={canViewOwner}
              />
            ) : activeTab === 'about-payment' && detail ? (
              <PharmacyAboutPaymentTab detail={detail} />
            ) : activeTab === 'documents' && detail ? (
              <PharmacyDocumentsTab key={pharmacyId} pharmacyId={pharmacyId} />
            ) : activeTab === 'comments' && detail ? (
              <PharmacyCommentsTab
                key={pharmacyId}
                pharmacyId={pharmacyId}
                canManage={canEditPharmacy}
              />
            ) : activeTab === 'activity' && detail ? (
              <PharmacyActivityTab
                key={pharmacyId}
                pharmacyId={pharmacyId}
                initialState={initialActivityState}
              />
            ) : deferredTab ? (
              <ProfileResourceState
                variant="empty"
                icon={deferredTab.icon}
                title={deferredTab.title}
                description={deferredTab.description}
              />
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
