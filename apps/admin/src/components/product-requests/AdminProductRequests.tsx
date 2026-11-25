'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  ClipboardCheck,
  ClipboardList,
  ChevronDown,
  FilePlus2,
  FileText,
  Files,
  History,
  MessageSquareText,
  Package,
  PackageSearch,
  StickyNote,
  CheckCircle,
  CircleX,
  X,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@e-pharmacy/ui/primitives';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { useToast } from '@e-pharmacy/ui/feedback';

import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import { adminApiRoutes } from '@/lib/api/routes/admin-api-routes';
import { getAdminProductRequestCategories } from '@/lib/api/browser/admin-product-requests.api';
import { productRequestCommentsApi } from '@/lib/api/browser/admin-product-request-resources.api';

import { requestProductRequestNavigationRefresh } from '@/lib/product-requests/product-request-navigation-refresh';

import {
  parseAdminRequestDetail,
  REQUEST_TABS,
  REQUEST_TAB_LABELS,
  requestTabPath,
  type AdminRequestDetail,
  type RequestTab,
} from '@/lib/product-requests/admin-product-request-detail';

import { dispatchAdminBreadcrumbLabel } from '@/lib/layout/breadcrumb-label-event';
import type { ActivityUrlState } from '@/lib/audit/admin-activity-url';

import { canAdmin } from '@/lib/permissions/can-admin';
import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';

import { ActivityHistory } from '@/components/activity/ActivityHistory';
import { PharmacyCommentsTab } from '@/components/pharmacies/PharmacyDetailsPageContent/PharmacyCommentsTab';

import { AdminProductRequestOverview } from './AdminProductRequestOverview';
import { AdminProductRequestPanels } from './AdminProductRequestPanels';
import menuCss from '../pharmacies/PharmacyDetailsPageContent/PharmacyModerationActions.module.css';

import css from './AdminProductRequests.module.css';

//===================================================================

const icons = {
  details: PackageSearch,
  'product-data': Package,
  characteristics: ClipboardList,
  'about-product': FileText,
  'note-for-admin': StickyNote,
  documents: Files,
  comments: MessageSquareText,
  activity: History,
};

//===================================================================

const descriptions: Record<RequestTab, string> = {
  details: 'Review the saved product request and its moderation status.',
  'product-data':
    'Review the product name, image and catalog information submitted by the pharmacy owner.',

  characteristics:
    'Review the main product properties supplied for this request.',
  'about-product':
    'Review the product description submitted by the pharmacy owner.',
  'note-for-admin': 'Read the optional note submitted by the pharmacy owner.',

  documents: 'Review the supporting documents submitted with this request.',
  comments: 'Private working comments about this product request.',

  activity:
    'Review recorded changes, moderation decisions and private Admin comment events for this request.',
};

//===================================================================

const tabs: TabItem<RequestTab>[] = REQUEST_TABS.map((value) => {
  const Icon = icons[value];

  return { value, label: REQUEST_TAB_LABELS[value], icon: <Icon size={17} /> };
});

//===================================================================

type ModerationAction = 'approved' | 'rejected' | 'changes_requested';

//===================================================================

const choices = [
  {
    action: 'approved',
    label: 'Approve request',
    Icon: CheckCircle,
    style: menuCss.approveAction,
  },
  {
    action: 'changes_requested',
    label: 'Request corrections',
    Icon: ClipboardList,
    style: menuCss.correctionsAction,
  },
  {
    action: 'rejected',
    label: 'Reject request',
    Icon: CircleX,
    style: menuCss.dangerAction,
  },
] as const;

//===================================================================

export function AdminProductRequestDetails({
  requestId,
  activeTab = 'details',
  initialActivityState,
}: Readonly<{
  requestId: string;
  activeTab?: RequestTab;
  initialActivityState?: ActivityUrlState;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { access } = useAdminAuthorization();

  const canModerate = canAdmin(
    access,
    ADMIN_PERMISSIONS.productRequests.moderate
  );

  const canManageComments = canAdmin(
    access,
    ADMIN_PERMISSIONS.productRequests.edit
  );

  const canViewOwner = canAdmin(access, ADMIN_PERMISSIONS.pharmacyOwners.view);
  const [reload, setReload] = useState(0);

  const [result, setResult] = useState<{
    id: string;
    version: number;
    request?: AdminRequestDetail;
    error?: string;
  } | null>(null);

  const current =
    result?.id === requestId && result.version === reload ? result : null;

  const request = current?.request;
  const [action, setAction] = useState<ModerationAction | null>(null);
  const [reason, setReason] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [categoriesError, setCategoriesError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const canDecide = Boolean(
    canModerate && request?.status === 'on_moderation' && !request.reviewState
  );

  useEffect(() => {
    const controller = new AbortController();

    void localApiRequest(adminApiRoutes.productRequests.details(requestId), {
      signal: controller.signal,
    })
      .then((raw) => {
        if (!controller.signal.aborted)
          setResult({
            id: requestId,
            version: reload,
            request: parseApiResponseData(raw, parseAdminRequestDetail),
          });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({
            id: requestId,
            version: reload,
            error: 'Could not load this product request. Please try again.',
          });
      });

    return () => controller.abort();
  }, [requestId, reload]);

  useEffect(() => {
    dispatchAdminBreadcrumbLabel(request?.name ?? 'Product request');
  }, [pathname, request?.name]);

  useEffect(() => {
    if (action !== 'approved' || request?.category?.id) return;

    const controller = new AbortController();

    void getAdminProductRequestCategories({ signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted)
          setCategories(
            items.map((item) => ({ id: item.id, name: item.name }))
          );
      })
      .catch(() => {
        if (!controller.signal.aborted) setCategoriesError(true);
      });

    return () => controller.abort();
  }, [action, request?.category?.id]);

  useEffect(() => {
    if (!menuOpen) return;

    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest('[data-request-status-menu]')
      )
        setMenuOpen(false);
    };

    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);

    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', outside);
    };
  }, [menuOpen]);

  const decide = async () => {
    if (!action || busy || !canDecide || !request) return;

    if (action !== 'approved' && !reason.trim()) {
      toast.error('A reason is required.');
      return;
    }

    if (action === 'approved' && !request.category?.id && !categoryId) {
      toast.error('Choose a catalog category before approving this request.');
      return;
    }

    setBusy(true);

    try {
      const body =
        action === 'changes_requested'
          ? {
              status: 'on_moderation',
              reviewState: 'changes_requested',
              reason: reason.trim(),
            }
          : action === 'rejected'
            ? { status: 'rejected', reason: reason.trim() }
            : { status: 'approved', ...(categoryId ? { categoryId } : {}) };

      await localApiRequest(adminApiRoutes.productRequests.status(requestId), {
        method: 'PATCH',
        body,
      });

      requestProductRequestNavigationRefresh();
      toast.success('Request status updated.');
      setAction(null);
      setReason('');
      setCategoryId('');
      setReload((v) => v + 1);
      router.refresh();
    } catch {
      toast.error(
        'Could not update request status. Please refresh and try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const Icon = icons[activeTab];

  const title =
    activeTab === 'details' ? 'Product details' : REQUEST_TAB_LABELS[activeTab];

  return (
    <main className={css.page} aria-labelledby="request-title">
      <section className={css.card}>
        <PageHeader
          titleId="request-title"
          title={
            <span className={css.title}>
              {request?.name ?? 'Product request'}
            </span>
          }
          icon={<FilePlus2 size={23} />}
          actions={
            canModerate && request?.status === 'on_moderation' ? (
              <div className={menuCss.menuWrapper} data-request-status-menu>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  iconLeft={<ClipboardCheck size={17} />}
                  iconRight={<ChevronDown size={16} />}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  Manage request status
                </Button>

                {menuOpen ? (
                  <div className={menuCss.menu}>
                    {choices.map(
                      ({ action: choice, label, Icon: ActionIcon, style }) => (
                        <button
                          key={choice}
                          type="button"
                          className={style}
                          disabled={!canDecide || busy}
                          onClick={() => {
                            setMenuOpen(false);
                            setReason('');
                            setCategoryId('');
                            setCategoriesError(false);
                            setAction(choice);
                          }}
                        >
                          <ActionIcon size={17} />
                          {label}
                        </button>
                      )
                    )}
                    {request.reviewState ? (
                      <small className={menuCss.savedDraftHint}>
                        Awaiting the owner’s corrections and resubmission.
                      </small>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : undefined
          }
        />
      </section>

      <section className={css.card}>
        <Tabs
          items={tabs}
          activeValue={activeTab}
          ariaLabel="Product request tabs"
          mobileVisibleCount={1}
          tabletVisibleCount={4}
          onChange={(tab) => {
            if (tab !== activeTab)
              router.push(requestTabPath(requestId, tab), { scroll: false });
          }}
        />
        {activeTab === 'comments' ? (
          <PharmacyCommentsTab
            key={requestId}
            pharmacyId={requestId}
            canManage={canManageComments}
            resource="product request"
            api={productRequestCommentsApi}
          />
        ) : (
          <section
            className={css.tabContent}
            aria-labelledby="request-section-title"
          >
            <ProfileSectionHeader
              title={title}
              titleId="request-section-title"
              description={descriptions[activeTab]}
              icon={<Icon size={21} />}
            />
            {activeTab === 'activity' ? (
              <>
                <ActivityHistory
                  key={requestId}
                  scopeRequestId={requestId}
                  initialState={initialActivityState}
                />
                {request?.history.some((entry) => !entry.isInferred) ? (
                  <details className={css.legacyHistory}>
                    <summary>Recorded request history</summary>
                    <p>
                      These lifecycle messages may predate detailed auditing.
                      They do not contain field-by-field comparisons or verified
                      author names.
                    </p>
                    <ol>
                      {[...request.history]
                        .reverse()
                        .filter((entry) => !entry.isInferred)
                        .map((entry) => (
                          <li key={entry.id}>
                            <strong>{entry.title}</strong> — {entry.description}{' '}
                            ·{' '}
                            {new Date(entry.createdAt).toLocaleString('en-GB')}
                          </li>
                        ))}
                    </ol>
                  </details>
                ) : null}
              </>
            ) : !current ? (
              <ProfileResourceState
                variant="loading"
                title={`Loading ${title.toLowerCase()}`}
                description="The saved product request information is being loaded."
              />
            ) : current.error ? (
              <ProfileResourceState
                variant="error"
                title="Product request could not be loaded"
                description={current.error}
                retryLabel="Try again"
                sideActionOnDesktop
                onRetry={() => setReload((v) => v + 1)}
              />
            ) : request ? (
              <>
                {request.rejectionReason ? (
                  <div className={css.feedback}>
                    <strong>Administrator feedback</strong>
                    <p>{request.rejectionReason}</p>
                  </div>
                ) : null}
                {activeTab === 'details' ? (
                  <AdminProductRequestOverview
                    request={request}
                    canViewOwner={canViewOwner}
                  />
                ) : (
                  <AdminProductRequestPanels
                    request={request}
                    tab={activeTab}
                  />
                )}
              </>
            ) : null}
          </section>
        )}
      </section>
      {action && canDecide ? (
        <ConfirmationModal
          title={
            action === 'approved'
              ? 'Approve this product request?'
              : action === 'rejected'
                ? 'Reject this product request?'
                : 'Request corrections?'
          }
          eyebrow="Product request status"
          confirmLabel={
            action === 'approved'
              ? 'Approve request'
              : action === 'rejected'
                ? 'Reject request'
                : 'Request corrections'
          }
          cancelLabel="Keep reviewing"
          confirmIconLeft={<CheckCircle size={17} />}
          cancelIconLeft={<X size={17} />}
          isLoading={busy}
          destructive={action === 'rejected'}
          confirmButtonClassName={
            action === 'changes_requested' ? css.warningConfirm : undefined
          }
          closeOnBackdrop={!busy}
          closeOnEscape={!busy}
          description={
            <div className={css.modalBody}>
              <div className={menuCss.statusTransition}>
                <StatusBadge
                  {...PRODUCT_REQUEST_STATUS_PRESENTATION.on_moderation}
                />
                <ArrowRight size={17} />
                <StatusBadge
                  {...PRODUCT_REQUEST_STATUS_PRESENTATION[
                    action === 'changes_requested' ? 'on_moderation' : action
                  ]}
                />
                {action === 'changes_requested' ? (
                  <StatusBadge label="Needs changes" tone="neutral" />
                ) : null}
              </div>
              <p>
                {action === 'approved'
                  ? 'Approval creates or links a global product. This cannot be undone.'
                  : action === 'rejected'
                    ? 'The request becomes Rejected / Cancelled by Admin.'
                    : 'The owner can correct the request and resubmit it. Moderation remains locked until then.'}
              </p>
              {action !== 'approved' ? (
                <label className={css.reason}>
                  Reason for Admin feedback *
                  <textarea
                    required
                    maxLength={1000}
                    value={reason}
                    disabled={busy}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
              ) : request?.category?.id ? null : (
                <label className={css.reason}>
                  Catalog category *
                  <select
                    required
                    value={categoryId}
                    disabled={busy}
                    onChange={(event) => setCategoryId(event.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categoriesError ? (
                    <span>Could not load categories. Close and retry.</span>
                  ) : null}
                </label>
              )}
            </div>
          }
          onConfirm={() => void decide()}
          onCancel={() => {
            if (!busy) {
              setAction(null);
              setReason('');
            }
          }}
        />
      ) : null}
    </main>
  );
}
