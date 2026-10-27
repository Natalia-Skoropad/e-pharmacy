'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  Activity,
  Building2,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileText,
  History,
  MessageSquareText,
  Package,
  PackageSearch,
  Pencil,
  ShoppingBag,
  Star,
  UsersRound,
} from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import type { OwnedPharmacyDetailResponse } from '@e-pharmacy/types/pharmacies';

import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  StatsCard,
  StatsGrid,
  StatsLoadingSkeleton,
} from '@e-pharmacy/ui/statistics';
import { formatMoney } from '@e-pharmacy/utils';

import { getOwnedPharmacyDetail } from '@/lib/api/browser/owned-pharmacy-registry.api';
import { sendOwnedPharmacyForVerification } from '@/lib/api/browser/owned-pharmacy-editor.api';

import {
  createPharmacyNote,
  deletePharmacyNote,
  getPharmacyNotes,
} from '@/lib/api/browser/pharmacy-notes.api';

import {
  buildOwnedPharmacyDetailUrl,
  type OwnedPharmacyDetailTab,
} from '@/lib/pharmacies/owned-pharmacy-url';

import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';
import { getProfileErrorMessage } from '@/lib/errors/get-profile-error-message';
import { dispatchPharmacyCounterRefresh } from '@/lib/pharmacies/pharmacy-counter-refresh';

import { EntityComments } from '@/components/comments/EntityComments';

import { OwnedPharmacyEditor } from '../OwnedPharmacyEditor/OwnedPharmacyEditor';
import { Information } from './OwnedPharmacyInformationTab';
import { About, Payment } from './OwnedPharmacyAboutPaymentTabs';
import { DocumentsResource } from './OwnedPharmacyDocumentsTab';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

const TABS: TabItem<OwnedPharmacyDetailTab>[] = [
  {
    value: 'information',
    label: 'Pharmacy information',
    icon: <Building2 size={17} />,
  },
  { value: 'about', label: 'About pharmacy', icon: <FileText size={17} /> },
  {
    value: 'payment',
    label: 'Payment details',
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

const DESCRIPTIONS: Record<OwnedPharmacyDetailTab, string> = {
  information:
    'Review published pharmacy details separately from submitted changes awaiting moderation.',

  about: 'Review the approved pharmacy description and any proposed changes.',

  payment:
    'Review approved private payment data separately from submitted changes.',

  documents: 'Review your pharmacy verification documents and submitted files.',

  comments:
    'Private working notes about this pharmacy, visible to authorized pharmacy staff.',

  reviews:
    'Pharmacy reviews will be available when the Reviews module is connected.',

  orders:
    'Pharmacy orders will be available when the Orders module is connected.',

  clients:
    'Pharmacy clients will be available when the Clients module is connected.',

  products:
    'Products will be available when the pharmacy product module is connected.',
  'product-requests':
    'Product requests will be available when the request module is connected.',

  activity:
    'Audit events for this pharmacy will be available after the activity resource is connected.',
};

//===================================================================

const DEFERRED: Partial<
  Record<OwnedPharmacyDetailTab, { title: string; icon: ReactNode }>
> = {
  reviews: {
    title: 'Pharmacy reviews are not connected yet',
    icon: <Star size={30} />,
  },

  orders: {
    title: 'Pharmacy orders are not connected yet',
    icon: <ShoppingBag size={30} />,
  },

  clients: {
    title: 'Pharmacy clients are not connected yet',
    icon: <UsersRound size={30} />,
  },

  products: {
    title: 'Pharmacy products are not connected yet',
    icon: <Package size={30} />,
  },

  'product-requests': {
    title: 'Product requests are not connected yet',
    icon: <PackageSearch size={30} />,
  },

  activity: {
    title: 'Pharmacy activity history is not connected yet',
    icon: <History size={30} />,
  },
};

//===================================================================

type DetailResult = Readonly<{
  pharmacyId: string;
  retry: number;
  detail: OwnedPharmacyDetailResponse | null;
  error: 'not-found' | 'forbidden' | 'error' | null;
}>;

//===================================================================

export function OwnedPharmacyDetailPageContent({
  pharmacyId,
  activeTab,
}: Readonly<{
  pharmacyId: string;
  activeTab: OwnedPharmacyDetailTab;
}>) {
  const router = useRouter();
  const toast = useToast();
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<DetailResult | null>(null);
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);

  const isCurrent =
    result?.pharmacyId === pharmacyId && result?.retry === retry;

  const detail = isCurrent ? result?.detail : null;
  const error = isCurrent ? result?.error : null;
  const loading = !detail && !error;
  const pharmacy = detail?.pharmacy;

  useEffect(() => {
    dispatchPharmacyBreadcrumbLabel(`Pharmacy #${pharmacyId}`);
  }, [pharmacyId]);

  useEffect(() => {
    if (pharmacy?.name) dispatchPharmacyBreadcrumbLabel(pharmacy.name);
  }, [pharmacy?.name, activeTab]);

  useEffect(() => {
    const controller = new AbortController();

    void getOwnedPharmacyDetail(pharmacyId, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted)
          setResult({ pharmacyId, retry, detail: value, error: null });
      })

      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        const status = isApiError(cause) ? cause.httpStatus : undefined;

        setResult({
          pharmacyId,
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
  }, [pharmacyId, retry]);

  const refresh = useCallback(() => setRetry((n) => n + 1), []);

  const canSubmit =
    pharmacy?.membershipRole === 'owner' &&
    (pharmacy.status === 'new' ||
      (pharmacy.status === 'on_verification' &&
        pharmacy.reviewState === 'changes_requested'));

  const sendForVerification = async () => {
    if (!canSubmit || sending) return;

    setSending(true);

    try {
      await sendOwnedPharmacyForVerification(pharmacyId);

      dispatchPharmacyCounterRefresh();

      toast.success('Pharmacy sent for verification.');
      refresh();
    } catch (cause) {
      toast.error(
        getProfileErrorMessage(
          cause,
          'Complete and save the pharmacy details and documents before verification.'
        )
      );
    } finally {
      setSending(false);
    }
  };

  if (
    editing &&
    pharmacy?.membershipRole === 'owner' &&
    pharmacy.status === 'new'
  ) {
    return (
      <OwnedPharmacyEditor
        pharmacyId={pharmacyId}
        onSaved={() => {
          setEditing(false);
          refresh();
        }}
      />
    );
  }

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

  const selected = TABS.find((item) => item.value === activeTab) ?? TABS[0]!;
  const deferred = DEFERRED[activeTab];

  return (
    <main className={css.page} aria-labelledby="owned-pharmacy-title">
      <section className={css.card}>
        <div className={css.headerStack}>
          <PageHeader
            className={css.pageHeader}
            title={
              <span className={css.titleWithHelp}>
                {pharmacy?.name || 'Pharmacy'}
                <InfoTooltip
                  label="About pharmacy details"
                  title="Pharmacy details"
                  icon={<CircleHelp size={20} aria-hidden="true" />}
                  escapeOverflow
                  items={[
                    {
                      title: 'Current pharmacy status',
                      description:
                        'The status is displayed in Pharmacy information.',
                      icon: <Building2 size={17} />,
                    },
                    {
                      title: 'Pharmacy overview',
                      description:
                        'Four cards summarize clients, orders, products and reviews.',
                      icon: <ClipboardList size={17} />,
                    },
                    {
                      title: 'Pharmacy data and history',
                      description:
                        'Each tab has its own URL. Inactive tabs do not fetch data.',
                      icon: <Activity size={17} />,
                    },
                  ]}
                />
              </span>
            }
            titleId="owned-pharmacy-title"
            icon={<Building2 size={23} aria-hidden="true" />}
            actions={
              pharmacy?.membershipRole === 'owner' ? (
                <div className={css.actions}>
                  {pharmacy.status === 'new' && (
                    <Button
                      variant="secondary"
                      iconLeft={<Pencil size={17} />}
                      onClick={() => setEditing(true)}
                    >
                      Edit draft
                    </Button>
                  )}
                  {canSubmit && (
                    <Button
                      iconLeft={<CheckCircle2 size={17} />}
                      isLoading={sending}
                      disabled={sending}
                      onClick={() => void sendForVerification()}
                    >
                      Send for verification
                    </Button>
                  )}
                </div>
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
                icon={<Package size={26} />}
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
            activeValue={activeTab}
            mobileVisibleCount={1}
            tabletVisibleCount={3}
            onChange={(tab) => {
              if (tab !== activeTab)
                router.replace(buildOwnedPharmacyDetailUrl(pharmacyId, tab), {
                  scroll: false,
                });
            }}
          />

          <section
            role="tabpanel"
            tabIndex={0}
            className={css.tabPanel}
            id={`owned-pharmacy-detail-panel-${activeTab}`}
            aria-labelledby={`owned-pharmacy-detail-tab-${activeTab}`}
          >
            {activeTab !== 'documents' && activeTab !== 'comments' && (
              <ProfileSectionHeader
                title={selected.label}
                description={DESCRIPTIONS[activeTab]}
                icon={selected.icon ?? <Building2 size={21} />}
              />
            )}
            {activeTab === 'documents' ? (
              <DocumentsResource key={pharmacyId} pharmacyId={pharmacyId} />
            ) : activeTab === 'comments' ? (
              <EntityComments
                entityKey={`pharmacy:${pharmacyId}`}
                description={DESCRIPTIONS.comments}
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
            ) : loading ? (
              <ProfileResourceState
                variant="loading"
                title="Loading pharmacy details"
                description="The pharmacy overview is being loaded."
              />
            ) : detail && activeTab === 'information' ? (
              <Information detail={detail} />
            ) : pharmacy && activeTab === 'about' ? (
              <About pharmacy={pharmacy} />
            ) : pharmacy && activeTab === 'payment' ? (
              <Payment pharmacy={pharmacy} />
            ) : deferred ? (
              <ProfileResourceState
                variant="empty"
                icon={deferred.icon}
                title={deferred.title}
                description={DESCRIPTIONS[activeTab]}
              />
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
