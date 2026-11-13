'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  Boxes,
  Building2,
  ExternalLink,
  ClipboardList,
  CreditCard,
  FileText,
  Files,
  History,
  MessageSquareText,
  ShoppingBag,
  Star,
  UsersRound,
} from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import type { OwnedPharmacyDetailResponse } from '@e-pharmacy/types/pharmacies';

import { PageHeader } from '@e-pharmacy/ui/layout';
import { LinkButton, Tabs, type TabItem } from '@e-pharmacy/ui/navigation';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import {
  StatsCard,
  StatsGrid,
  StatsLoadingSkeleton,
} from '@e-pharmacy/ui/statistics';

import { formatMoney } from '@e-pharmacy/utils';

import { getOwnedPharmacyDetail } from '@/lib/api/browser/owned-pharmacy-registry.api';

import {
  canOpenClientPharmacyPage,
  getClientPharmacyUrl,
} from '@/lib/layout/external-links';

import {
  createPharmacyNote,
  deletePharmacyNote,
  getPharmacyNotes,
} from '@/lib/api/browser/pharmacy-notes.api';

import {
  buildOwnedPharmacyDetailUrl,
  type OwnedPharmacyDetailTab,
} from '@/lib/pharmacies/owned-pharmacy-url';

import {
  buildEmbeddedOwnProductsPath,
  DEFAULT_OWN_PRODUCTS_PAGINATION,
  type OwnProductsPagination,
} from '@/lib/products/own-product-paths';

import {
  DEFAULT_OWN_PRODUCTS_FILTERS,
  type OwnProductsFilterState,
} from '@/lib/products/own-products-filters';

import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';

import { type OrdersFilterState } from '@/lib/orders/orders-filters';
import { type OrdersPagination } from '@/lib/orders/order-paths';

import {
  DEFAULT_CLIENTS_FILTERS,
  buildClientsPath,
  type ClientsFilterState,
  type ClientsPaginationState,
} from '@/lib/clients/client-paths';

import { usePharmacySelection } from '@/providers/PharmacySelectionProvider';

import { EntityComments } from '@/components/comments/EntityComments';
import { OrdersPageContent } from '@/components/orders/OrdersPageContent';
import { ClientsPageContent } from '@/components/clients/ClientsPageContent/ClientsPageContent';
import { ClientsTable } from '@/components/clients/ClientsTable/ClientsTable';
import { OwnerOwnProductsPageContent } from '@/components/products/OwnProductsPageContent';

import { Information } from './OwnedPharmacyInformationTab';
import { OwnedPharmacyActivityTab } from './OwnedPharmacyActivityTab';
import { Payment } from './OwnedPharmacyAboutPaymentTabs';
import { DocumentsResource } from './OwnedPharmacyDocumentsTab';
import { OwnedPharmacyEditableTab } from './OwnedPharmacyEditableTab';
import { OwnedPharmacyActions } from './OwnedPharmacyActions';
import { OwnedPharmacyHelp } from './OwnedPharmacyHelp';
import { OwnedPharmacySectionReview } from './OwnedPharmacySectionReview';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

const TABS: TabItem<OwnedPharmacyDetailTab>[] = [
  {
    value: 'information',
    label: 'Pharmacy information',
    icon: <Building2 size={17} />,
  },
  { value: 'data', label: 'Pharmacy data', icon: <ClipboardList size={17} /> },
  { value: 'about', label: 'About pharmacy', icon: <FileText size={17} /> },
  {
    value: 'payment',
    label: 'Payment details',
    icon: <CreditCard size={17} />,
  },
  { value: 'documents', label: 'Documents', icon: <Files size={17} /> },
  {
    value: 'comments',
    label: 'Comments',
    icon: <MessageSquareText size={17} />,
  },
  { value: 'reviews', label: 'Reviews', icon: <Star size={17} /> },
  { value: 'orders', label: 'Orders', icon: <ShoppingBag size={17} /> },
  { value: 'clients', label: 'Clients', icon: <UsersRound size={17} /> },
  { value: 'products', label: 'Products', icon: <Boxes size={17} /> },
  { value: 'activity', label: 'Activity history', icon: <History size={17} /> },
];

//===================================================================

const DESCRIPTIONS: Record<OwnedPharmacyDetailTab, string> = {
  information:
    'Review published pharmacy details separately from submitted changes awaiting moderation.',

  data: 'Edit your pharmacy photo, contacts, location and working hours.',

  about: 'Review the approved pharmacy description and any proposed changes.',

  payment:
    'Review approved private payment data separately from submitted changes.',

  documents: 'Review your pharmacy verification documents and submitted files.',

  comments:
    'Private working notes about this pharmacy, visible to authorized pharmacy staff.',

  reviews:
    'Pharmacy reviews will be available when the Reviews module is connected.',

  orders: 'View and process orders belonging to this pharmacy only.',
  clients: 'View clients and order history for this pharmacy only.',
  products: 'Manage this pharmacy’s offers, stock and product availability.',

  activity:
    'Review all pharmacy status changes, submitted requests and moderation decisions.',
};

//===================================================================

const DEFERRED: Partial<
  Record<OwnedPharmacyDetailTab, { title: string; icon: ReactNode }>
> = {
  reviews: {
    title: 'Pharmacy reviews are not connected yet',
    icon: <Star size={30} />,
  },
};

//===================================================================

type DetailResult = Readonly<{
  pharmacyId: string;
  tab: OwnedPharmacyDetailTab;
  retry: number;
  detail: OwnedPharmacyDetailResponse | null;
  error: 'not-found' | 'forbidden' | 'error' | null;
}>;

//===================================================================

export function OwnedPharmacyDetailPageContent({
  pharmacyId,
  activeTab,
  initialClientFilters,
  initialClientPagination,
  initialProductFilters,
  initialProductPagination,
  initialOrderFilters,
  initialOrderPagination,
}: Readonly<{
  pharmacyId: string;
  activeTab: OwnedPharmacyDetailTab;
  initialClientFilters?: ClientsFilterState;
  initialClientPagination?: ClientsPaginationState;
  initialProductFilters?: OwnProductsFilterState;
  initialProductPagination?: OwnProductsPagination;
  initialOrderFilters?: OrdersFilterState;
  initialOrderPagination?: OrdersPagination;
}>) {
  const router = useRouter();

  const {
    selectedId,
    isLoading: selectionLoading,
    isInvalid: selectionInvalid,
  } = usePharmacySelection();

  // Update the displayed tab immediately on click, but let route props take
  // precedence once navigation resolves (including browser history changes).
  // Adjusting state during render *only when the route changes* avoids an
  // effect-driven cascading render and preserves the already-loaded detail.
  const [tabSelection, setTabSelection] = useState({
    routeTab: activeTab,
    selectedTab: activeTab,
  });

  if (tabSelection.routeTab !== activeTab) {
    setTabSelection({ routeTab: activeTab, selectedTab: activeTab });
  }

  const visibleTab =
    tabSelection.routeTab === activeTab ? tabSelection.selectedTab : activeTab;

  const [headerActionTarget, setHeaderActionTarget] =
    useState<HTMLDivElement | null>(null);

  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<DetailResult | null>(null);

  const isCurrent =
    result?.pharmacyId === pharmacyId &&
    result?.tab === activeTab &&
    result?.retry === retry &&
    visibleTab === activeTab;

  const detail = isCurrent ? result?.detail : null;
  const error = isCurrent ? result?.error : null;
  const loading = !detail && !error;
  const pharmacy = detail?.pharmacy;

  const publicPharmacyHref =
    pharmacy && canOpenClientPharmacyPage(pharmacy.status)
      ? getClientPharmacyUrl(pharmacy)
      : undefined;

  const isEditTab = ['data', 'about', 'payment', 'documents'].includes(
    visibleTab
  );

  const canEditPharmacy = Boolean(
    pharmacy &&
    pharmacy.membershipRole === 'owner' &&
    (pharmacy.status === 'new' ||
      pharmacy.status === 'active' ||
      (pharmacy.status === 'blocked' && pharmacy.reviewState !== 'pending') ||
      (['on_verification', 'on_moderation', 'on_reactivation'].includes(
        pharmacy.status
      ) &&
        pharmacy.reviewState === 'changes_requested'))
  );

  // Keep the information icon beside the last word instead of leaving
  // it alone on a new line when a long pharmacy name wraps on mobile.
  const pharmacyName = pharmacy?.name.trim() || 'Pharmacy';
  const lastSpace = pharmacyName.lastIndexOf(' ');
  const titlePrefix = lastSpace >= 0 ? pharmacyName.slice(0, lastSpace) : '';

  const titleEnd =
    lastSpace >= 0 ? pharmacyName.slice(lastSpace + 1) : pharmacyName;

  useEffect(() => {
    dispatchPharmacyBreadcrumbLabel(`Pharmacy #${pharmacyId}`);
  }, [pharmacyId]);

  useEffect(() => {
    if (pharmacy?.name) dispatchPharmacyBreadcrumbLabel(pharmacy.name);
  }, [pharmacy?.name, visibleTab]);

  useEffect(() => {
    const controller = new AbortController();

    void getOwnedPharmacyDetail(pharmacyId, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted)
          setResult({
            pharmacyId,
            tab: activeTab,
            retry,
            detail: value,
            error: null,
          });
      })

      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        const status = isApiError(cause) ? cause.httpStatus : undefined;

        // A successful HTTP response can still fail DTO validation. Log only
        // safe metadata in development, never the private pharmacy payload.
        if (process.env.NODE_ENV !== 'production') {
          console.error('[owned-pharmacy-detail] load failed', {
            status,
            code: isApiError(cause) ? cause.transportCode : undefined,

            message:
              cause instanceof Error ? cause.message : 'Unknown load error',
          });
        }

        setResult({
          pharmacyId,
          tab: activeTab,
          retry,
          detail: null,

          error:
            status === 404
              ? 'not-found'
              : status === 403
                ? 'forbidden'
                : 'error',
        });
      });

    return () => controller.abort();
  }, [pharmacyId, activeTab, retry]);

  // An admin can request corrections in a different browser tab. Refresh the
  // read-only information tab when its window becomes visible again, without
  // clearing its content or resetting a form with unsaved changes on another tab.
  useEffect(() => {
    if (activeTab !== 'information') return;

    let controller = new AbortController();

    const refreshVisibleInformation = () => {
      if (document.visibilityState !== 'visible') return;

      controller.abort();
      controller = new AbortController();

      const signal = controller.signal;

      void getOwnedPharmacyDetail(pharmacyId, { signal })
        .then((value) => {
          if (!signal.aborted) {
            setResult({
              pharmacyId,
              tab: activeTab,
              retry,
              detail: value,
              error: null,
            });
          }
        })
        .catch(() => {
          // Keep the last verified view; normal navigation/retry surfaces errors.
        });
    };

    window.addEventListener('focus', refreshVisibleInformation);
    document.addEventListener('visibilitychange', refreshVisibleInformation);

    return () => {
      controller.abort();
      window.removeEventListener('focus', refreshVisibleInformation);

      document.removeEventListener(
        'visibilitychange',
        refreshVisibleInformation
      );
    };
  }, [pharmacyId, activeTab, retry]);

  const refresh = useCallback(() => setRetry((n) => n + 1), []);

  if (error)
    return (
      <main className={css.page}>
        <section className={css.card}>
          <ProfileResourceState
            variant="error"
            title={
              error === 'not-found'
                ? 'Pharmacy not found'
                : error === 'forbidden'
                  ? 'Permission required'
                  : 'Pharmacy details could not be loaded'
            }
            description={
              error === 'forbidden'
                ? 'You do not have access to this pharmacy.'
                : error === 'not-found'
                  ? 'This pharmacy does not exist or is no longer available.'
                  : 'The pharmacy may be temporarily unavailable. Please try again.'
            }
            retryLabel="Try again"
            sideActionOnDesktop
            onRetry={refresh}
          />
        </section>
      </main>
    );

  const selected = TABS.find((item) => item.value === visibleTab) ?? TABS[0]!;
  const deferred = DEFERRED[visibleTab];

  return (
    <main className={css.page} aria-labelledby="owned-pharmacy-title">
      <section className={css.card}>
        <div className={css.headerStack}>
          <PageHeader
            className={css.pageHeader}
            title={
              <span className={css.titleWithHelp}>
                {titlePrefix ? `${titlePrefix} ` : null}
                <span className={css.titleEnding}>
                  {titleEnd}
                  {pharmacy ? <OwnedPharmacyHelp pharmacy={pharmacy} /> : null}
                </span>
              </span>
            }
            titleId="owned-pharmacy-title"
            icon={<Building2 size={23} aria-hidden="true" />}
            actions={
              pharmacy ? (
                <OwnedPharmacyActions pharmacy={pharmacy} onRefresh={refresh} />
              ) : undefined
            }
          />
          {detail?.metrics ? (
            <StatsGrid
              className={css.statistics}
              columns={4}
              tabletColumns={2}
              ariaLabel="Pharmacy performance summary"
            >
              <StatsCard
                title="Active clients"
                value={detail.metrics.activeClientsCount}
                tone="blue"
                icon={<UsersRound size={26} />}
              />

              <StatsCard
                title="Successful orders"
                value={detail.metrics.successfulOrdersCount}
                meta={formatMoney(detail.metrics.successfulRevenue) ?? '—'}
                tone="green"
                icon={<ShoppingBag size={26} />}
              />

              <StatsCard
                title="Added products"
                value={detail.metrics.addedProductsCount}
                tone="purple"
                icon={<Boxes size={26} />}
              />

              <StatsCard
                title="Rating / reviews"
                value={
                  detail.metrics.reviewsCount
                    ? detail.metrics.rating.toFixed(1)
                    : 0
                }
                meta={`${detail.metrics.reviewsCount} reviews`}
                tone="orange"
                icon={<Star size={26} />}
              />
            </StatsGrid>
          ) : (
            <div className={css.statistics}>
              <StatsLoadingSkeleton
                count={4}
                columns={4}
                tabletColumns={2}
                label="Loading pharmacy performance summary"
              />
            </div>
          )}
        </div>
      </section>

      <section className={css.card} aria-label="Pharmacy detail sections">
        <div className={css.tabsStack}>
          <Tabs
            idBase="owned-pharmacy-detail"
            items={TABS}
            ariaLabel="Pharmacy details tabs"
            activeValue={visibleTab}
            mobileVisibleCount={1}
            tabletVisibleCount={3}
            onChange={(tab) => {
              if (tab !== visibleTab) {
                const href = buildOwnedPharmacyDetailUrl(pharmacyId, tab);

                const navigation = new CustomEvent(
                  'e-pharmacy:owned-pharmacy-tab-navigation',
                  {
                    cancelable: true,
                    detail: { href },
                  }
                );

                if (!window.dispatchEvent(navigation)) return;

                setTabSelection({ routeTab: activeTab, selectedTab: tab });
                router.replace(href, { scroll: false });
              }
            }}
          />

          <section
            role="tabpanel"
            tabIndex={0}
            className={css.tabPanel}
            id={`owned-pharmacy-detail-panel-${visibleTab}`}
            aria-labelledby={`owned-pharmacy-detail-tab-${visibleTab}`}
          >
            {visibleTab !== 'comments' && visibleTab !== 'orders' ? (
              <ProfileSectionHeader
                title={selected.label}
                description={DESCRIPTIONS[visibleTab]}
                icon={selected.icon ?? <Building2 size={21} />}
                action={
                  visibleTab === 'information' && publicPharmacyHref ? (
                    <LinkButton
                      href={publicPharmacyHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="primary"
                      size="sm"
                      iconLeft={<ExternalLink size={17} aria-hidden="true" />}
                      className={css.publicPharmacyLink}
                    >
                      View pharmacy on website
                    </LinkButton>
                  ) : isEditTab && canEditPharmacy ? (
                    <div
                      ref={setHeaderActionTarget}
                      className={css.headerActionTarget}
                    />
                  ) : undefined
                }
              />
            ) : null}
            {loading &&
            !['comments', 'clients', 'products', 'orders'].includes(
              visibleTab
            ) ? (
              <ProfileResourceState
                variant="loading"
                title="Loading pharmacy details"
                description="The pharmacy overview is being loaded."
              />
            ) : detail && pharmacy && visibleTab === 'information' ? (
              <Information detail={detail} />
            ) : pharmacy &&
              ['data', 'about', 'payment', 'documents'].includes(visibleTab) ? (
              <div className={css.formStack}>
                {pharmacy.membershipRole === 'owner' ? (
                  <OwnedPharmacySectionReview
                    section={
                      visibleTab as 'data' | 'about' | 'payment' | 'documents'
                    }
                    pharmacy={pharmacy}
                    onChanged={refresh}
                  />
                ) : null}
                {visibleTab === 'payment' &&
                pharmacy.membershipRole !== 'owner' ? (
                  <Payment pharmacy={pharmacy} />
                ) : visibleTab === 'documents' &&
                  pharmacy.membershipRole !== 'owner' ? (
                  <DocumentsResource key={pharmacyId} pharmacyId={pharmacyId} />
                ) : (
                  <OwnedPharmacyEditableTab
                    key={`${pharmacy.updatedAt}:${visibleTab}`}
                    headerActionTarget={headerActionTarget}
                    pharmacy={pharmacy}
                    tab={
                      visibleTab as 'data' | 'about' | 'payment' | 'documents'
                    }
                    readOnly={!canEditPharmacy}
                    onSaved={refresh}
                  />
                )}
              </div>
            ) : visibleTab === 'comments' ? (
              <EntityComments
                entityKey={`pharmacy:${pharmacyId}`}
                presentation="profile"
                isEditable={Boolean(pharmacy && pharmacy.status !== 'blocked')}
                title="Comments"
                description={DESCRIPTIONS.comments}
                emptyTitle="No internal comments yet"
                emptyText="Internal pharmacy comments will appear here."
                load={(page, options) =>
                  getPharmacyNotes('pharmacy', pharmacyId, page, options)
                }
                create={(text, options) =>
                  createPharmacyNote(
                    'pharmacy',
                    pharmacyId,
                    text,
                    options.clientRequestId,
                    options
                  )
                }
                remove={(id, options) =>
                  deletePharmacyNote('pharmacy', pharmacyId, id, options)
                }
              />
            ) : pharmacy && visibleTab === 'activity' ? (
              <OwnedPharmacyActivityTab
                key={pharmacyId}
                pharmacyId={pharmacyId}
              />
            ) : visibleTab === 'clients' ? (
              selectionInvalid ? (
                <ProfileResourceState
                  variant="error"
                  title="Pharmacy access unavailable"
                  description="The Clients tab requires access to this pharmacy."
                />
              ) : selectionLoading || selectedId !== pharmacyId ? (
                <div className={css.clientsLoadingPreview}>
                  <div className={css.clientsLoadingStatistics}>
                    <StatsLoadingSkeleton
                      count={3}
                      columns={3}
                      tabletColumns={2}
                      label="Loading pharmacy client statistics"
                    />
                  </div>
                  <ClientsTable clients={[]} isLoading emptyMessage="" />
                </div>
              ) : (
                <ClientsPageContent
                  key={buildClientsPath(
                    initialClientFilters ?? DEFAULT_CLIENTS_FILTERS,
                    buildOwnedPharmacyDetailUrl(pharmacyId, 'clients'),
                    initialClientPagination
                  )}
                  embedded
                  basePath={buildOwnedPharmacyDetailUrl(pharmacyId, 'clients')}
                  initialFilters={initialClientFilters}
                  initialPage={initialClientPagination?.page}
                  initialPerPage={initialClientPagination?.perPage}
                />
              )
            ) : visibleTab === 'products' ? (
              loading || pharmacy ? (
                <OwnerOwnProductsPageContent
                  key={buildEmbeddedOwnProductsPath(
                    pharmacyId,
                    initialProductFilters ?? DEFAULT_OWN_PRODUCTS_FILTERS,
                    initialProductPagination ?? DEFAULT_OWN_PRODUCTS_PAGINATION
                  )}
                  embeddedPharmacyId={pharmacyId}
                  // Only /pharmacy/pharmacies/:id/products; independent of /pharmacy/products.
                  minWidth={960}
                  initialFilters={initialProductFilters}
                  initialPagination={initialProductPagination}
                />
              ) : null
            ) : visibleTab === 'orders' ? (
              selectionInvalid ? (
                <ProfileResourceState
                  variant="error"
                  title="Pharmacy access unavailable"
                  description="You do not have access to this pharmacy."
                />
              ) : (
                <OrdersPageContent
                  key={`${pharmacyId}:orders`}
                  embedded
                  embeddedPharmacyId={pharmacyId}
                  embeddedReady={!selectionLoading && selectedId === pharmacyId}
                  initialFilters={initialOrderFilters}
                  initialPagination={initialOrderPagination}
                />
              )
            ) : deferred ? (
              <ProfileResourceState
                variant="empty"
                icon={deferred.icon}
                title={deferred.title}
                description={DESCRIPTIONS[visibleTab]}
              />
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
