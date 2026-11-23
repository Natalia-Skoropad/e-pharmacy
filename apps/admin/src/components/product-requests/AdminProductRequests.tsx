'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, FilePlus2, RefreshCw } from 'lucide-react';

import { Button } from '@e-pharmacy/ui/primitives';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { useToast } from '@e-pharmacy/ui/feedback';

import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { localApiRequest } from '@e-pharmacy/next-api/browser';
import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';

import { getAdminProductCategories } from '@/lib/api/browser/admin-product-categories.api';
import { adminApiRoutes } from '@/lib/api/routes/admin-api-routes';

import css from './AdminProductRequests.module.css';

//===================================================================

// Do not expose raw backend errors in the administration UI.
const getSafeApiErrorMessage = (_error: unknown, fallback: string) => fallback;

//===================================================================

type RequestRow = {
  id: string;
  name: string;
  article: string;
  status: ProductRequestStatus;
  reviewState?: 'changes_requested';
  cancelledBy?: 'admin' | 'owner';
  createdAt: string;
};

type RequestDetails = RequestRow & {
  brand?: string;
  series?: string;
  manufacturer?: string;
  releaseForm?: string;
  activeIngredients?: string;
  activeIngredientCount?: string;
  fullDescription?: string;
  pharmacyComment?: string;
  customCategory?: string;
  category?: { id: string; name: string };

  additionalFiles?: Array<{ documentId?: string; name: string }>;
  history?: Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string;
  }>;

  rejectionReason?: string;
};

type ListResponse = {
  items: RequestRow[];
  total: number;
  page: number;
  totalPages: number;
};

//===================================================================

function parseList(raw: unknown): ListResponse {
  if (
    !raw ||
    typeof raw !== 'object' ||
    !('items' in raw) ||
    !Array.isArray(raw.items)
  )
    throw new Error('Invalid requests response');

  return raw as ListResponse;
}

//===================================================================

function parseDetails(raw: unknown): RequestDetails {
  if (!raw || typeof raw !== 'object' || !('request' in raw) || !raw.request)
    throw new Error('Invalid request response');

  return raw.request as RequestDetails;
}

//===================================================================

export function AdminProductRequestsList() {
  const [items, setItems] = useState<RequestRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();

    localApiRequest(
      `${adminApiRoutes.productRequests.list}?page=${page}&perPage=20`,
      { signal: controller.signal }
    )
      .then((value) => {
        if (controller.signal.aborted) return;

        const response = parseApiResponseData(value, parseList);

        setItems(response.items);
        setTotalPages(Math.max(1, response.totalPages));
        setError('');
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setError(getSafeApiErrorMessage(err, 'Could not load requests.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, reload]);

  return (
    <main className={css.page}>
      <section className={css.card}>
        <PageHeader title="Product requests" icon={<FilePlus2 size={23} />} />
      </section>

      <section className={css.card}>
        {loading ? (
          <p>Loading requests...</p>
        ) : error ? (
          <div role="alert">
            <p>{error}</p>
            <Button
              type="button"
              onClick={() => {
                setLoading(true);
                setReload((v) => v + 1);
              }}
              iconLeft={<RefreshCw size={16} />}
            >
              Try again
            </Button>
          </div>
        ) : items.length ? (
          <div className={css.tableWrap}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Article</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.article || '—'}</td>
                    <td>
                      {new Date(item.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td>
                      <StatusBadge
                        {...PRODUCT_REQUEST_STATUS_PRESENTATION[item.status]}
                      />
                      {item.reviewState
                        ? ' · Needs changes'
                        : item.cancelledBy
                          ? ` · Cancelled by ${item.cancelledBy}`
                          : ''}
                    </td>
                    <td>
                      <Link href={`/admin/product-requests/${item.id}`}>
                        View request
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No product requests yet.</p>
        )}
        <div className={css.paging}>
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => {
              setLoading(true);
              setPage((v) => v - 1);
            }}
          >
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => {
              setLoading(true);
              setPage((v) => v + 1);
            }}
          >
            Next
          </Button>
        </div>
      </section>
    </main>
  );
}

//===================================================================

type ModerationAction = 'approved' | 'rejected' | 'changes_requested';

//===================================================================

export function AdminProductRequestDetails({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [action, setAction] = useState<ModerationAction | null>(null);
  const [reason, setReason] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    localApiRequest(adminApiRoutes.productRequests.details(requestId), {
      signal: controller.signal,
    })
      .then((raw) => {
        if (controller.signal.aborted) return;
        setRequest(parseApiResponseData(raw, parseDetails));
        setError('');
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setError(getSafeApiErrorMessage(err, 'Could not load this request.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [requestId, reload]);

  useEffect(() => {
    const controller = new AbortController();

    getAdminProductCategories({ perPage: 200 }, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted)
          setCategories(
            result.items.map((item) => ({ id: item.id, name: item.name }))
          );
      })
      .catch(() => {
        /* No category selector when settings are unavailable. */
      });
    return () => controller.abort();
  }, []);

  const mayModerate =
    request?.status === 'on_moderation' && !request.reviewState;

  const decide = async () => {
    if (!action || busy) return;

    setBusy(true);

    try {
      if (action !== 'approved' && !reason.trim()) {
        toast.error('A reason is required.');
        return;
      }

      if (action === 'approved' && !request?.category?.id && !categoryId) {
        toast.error('Choose a catalog category before approving this request.');
        return;
      }

      const body =
        action === 'changes_requested'
          ? {
              status: 'on_moderation',
              reviewState: 'changes_requested',
              reason,
            }
          : action === 'rejected'
            ? { status: 'rejected', reason }
            : {
                status: 'approved',
                ...(categoryId.trim() ? { categoryId: categoryId.trim() } : {}),
              };

      await localApiRequest(adminApiRoutes.productRequests.status(requestId), {
        method: 'PATCH',
        body,
      });

      toast.success('Request status updated.');
      setAction(null);
      setReason('');
      setReload((v) => v + 1);
      router.refresh();
    } catch (err) {
      toast.error(
        getSafeApiErrorMessage(err, 'Could not update request status.')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={css.page}>
      <section className={css.card}>
        <PageHeader
          title={request?.name ?? 'Product request'}
          icon={<FilePlus2 size={23} />}
        />
      </section>

      <section className={css.card}>
        {loading ? (
          <p>Loading request...</p>
        ) : error ? (
          <div role="alert">
            <p>{error}</p>
            <Button
              type="button"
              onClick={() => {
                setLoading(true);
                setReload((v) => v + 1);
              }}
            >
              Try again
            </Button>
          </div>
        ) : request ? (
          <>
            <div className={css.statusLine}>
              <StatusBadge
                {...PRODUCT_REQUEST_STATUS_PRESENTATION[request.status]}
              />
              {request.reviewState ? (
                <b>Needs changes</b>
              ) : request.cancelledBy ? (
                <b>Cancelled by {request.cancelledBy}</b>
              ) : null}
            </div>
            <p>
              {request.status === 'new'
                ? 'This request is being completed by its owner. Admin can view but cannot moderate it yet.'
                : request.reviewState
                  ? 'The owner is correcting the request. Moderation actions remain locked until resubmission.'
                  : ''}
            </p>
            <div className={css.fields}>
              {(
                [
                  ['Article', request.article],
                  [
                    'Category',
                    request.category?.name ?? request.customCategory,
                  ],
                  ['Brand', request.brand],
                  ['Series / Line', request.series],
                  ['Manufacturer', request.manufacturer],
                  ['Release form', request.releaseForm],
                  ['Active ingredients', request.activeIngredients],
                  ['Active ingredient count', request.activeIngredientCount],
                  ['About product', request.fullDescription],
                  ['Note for Admin', request.pharmacyComment],
                ] as const
              )
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <div key={label} className={css.field}>
                    <small>{label}</small>
                    <p>{value}</p>
                  </div>
                ))}
            </div>
            {request.additionalFiles?.length ? (
              <section>
                <h3>Documents</h3>
                {request.additionalFiles.map((doc) => (
                  <p key={doc.documentId ?? doc.name}>
                    {doc.documentId ? (
                      <a
                        href={`/api/admin/product-requests/${requestId}/documents/${doc.documentId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {doc.name}
                      </a>
                    ) : (
                      doc.name
                    )}
                  </p>
                ))}
              </section>
            ) : null}
            {request.history?.length ? (
              <section>
                <h3>Activity history</h3>
                <ol>
                  {[...request.history].reverse().map((entry) => (
                    <li key={entry.id}>
                      <strong>{entry.title}</strong> — {entry.description} ·{' '}
                      {new Date(entry.createdAt).toLocaleString('en-GB')}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
            {mayModerate ? (
              <div className={css.actions}>
                <Button
                  type="button"
                  iconLeft={<ClipboardCheck size={17} />}
                  onClick={() => setAction('approved')}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAction('changes_requested')}
                >
                  Request corrections
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAction('rejected')}
                >
                  Reject / Cancel by Admin
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
      {action ? (
        <ConfirmationModal
          title={
            action === 'approved'
              ? 'Approve this product request?'
              : action === 'rejected'
                ? 'Reject this product request?'
                : 'Request corrections?'
          }
          text={
            action === 'approved'
              ? 'Approving creates or links a global product. This cannot be undone.'
              : action === 'rejected'
                ? 'The request will become Rejected / Cancelled by Admin.'
                : 'The request remains On moderation with Needs changes. The owner can edit and resubmit it.'
          }
          confirmLabel={
            action === 'approved'
              ? 'Approve'
              : action === 'rejected'
                ? 'Reject request'
                : 'Request corrections'
          }
          cancelLabel="Keep reviewing"
          isLoading={busy}
          destructive={action === 'rejected'}
          description={
            <div>
              <p>
                {action === 'changes_requested'
                  ? 'The owner may edit and resubmit after these changes are requested.'
                  : action === 'rejected'
                    ? 'Admin cancellation is final.'
                    : 'Approval creates or links a global product.'}
              </p>
              {action !== 'approved' ? (
                <label className={css.reason}>
                  Reason for Admin feedback
                  <textarea
                    required
                    maxLength={1000}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Explain the required changes or rejection"
                  />
                </label>
              ) : request?.category?.id ? null : (
                <label className={css.reason}>
                  Catalog category ID (required for a custom category request)
                  <select
                    required
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          }
          onConfirm={() => void decide()}
          onCancel={() => {
            setAction(null);
            setReason('');
          }}
        />
      ) : null}
    </main>
  );
}
