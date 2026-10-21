'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  Activity,
  Building2,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  CreditCard,
  Eye,
  FileText,
  Files,
  History,
  ImageOff,
  Mail,
  MessageSquareText,
  Package,
  PackageSearch,
  Pencil,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Star,
  UsersRound,
  X,
} from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type {
  MyPharmacyProfile,
  OwnedPharmacyDetailResponse,
  PharmacyPendingModeration,
} from '@e-pharmacy/types/pharmacies';

import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';
import type { EditablePharmacyBankDetails } from '@e-pharmacy/types/pharmacies';
import { useToast } from '@e-pharmacy/ui/feedback';
import { MarkdownContent } from '@e-pharmacy/ui/data-display';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { InfoTooltip, ModalBase } from '@e-pharmacy/ui/overlays';

import {
  DocumentsPanel,
  PharmacyAboutFields,
  PharmacyPaymentFields,
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { Button, CopyButton } from '@e-pharmacy/ui/primitives';

import {
  StatsCard,
  StatsGrid,
  StatsLoadingSkeleton,
  StatusBadge,
} from '@e-pharmacy/ui/statistics';

import { formatMoney } from '@e-pharmacy/utils';
import { formatDateTime } from '@e-pharmacy/utils/date';

import {
  PHARMACY_DOCUMENT_ACCEPT,
  PHARMACY_DOCUMENT_RULES,
} from '@e-pharmacy/validation/files';

import { getOwnedPharmacyDetail } from '@/lib/api/browser/owned-pharmacy-registry.api';

import {
  downloadOwnedPharmacyDocument,
  getOwnedPharmacyProfile,
  sendOwnedPharmacyForVerification,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

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

import { EntityComments } from '@/components/comments/EntityComments';
import { OwnedPharmacyEditor } from '../OwnedPharmacyEditor/OwnedPharmacyEditor';

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

const show = (value?: string | null) => value?.trim() || '—';

//===================================================================

function DateValue({ value }: { value?: string }) {
  return value ? (
    <time dateTime={value}>{formatDateTime(value) ?? '—'}</time>
  ) : (
    <span>—</span>
  );
}

//===================================================================

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={css.field}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

//===================================================================

function Photo({ url, name }: { url?: string | null; name: string }) {
  return (
    <div className={css.photo}>
      {url ? (
        <ShimmerImage
          src={url}
          alt={name}
          className={css.coverImage}
          sizes="(max-width: 767px) 90vw, 400px"
          unoptimized
        />
      ) : (
        <div className={css.photoEmpty}>
          <Building2 size={48} />
          <ImageOff size={20} />
          <span>No pharmacy photo uploaded</span>
        </div>
      )}
    </div>
  );
}

//===================================================================

function Contact({ value, type }: { value?: string; type: 'email' | 'phone' }) {
  const toast = useToast();

  if (!value) return <span>—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);

      toast.success(`${type === 'email' ? 'Email' : 'Phone'} copied.`);
    } catch {
      toast.error(`Could not copy ${type}.`);
    }
  };

  return (
    <span className={css.contact}>
      {type === 'email' ? <Mail size={16} /> : <Phone size={16} />}
      <a href={`${type === 'email' ? 'mailto' : 'tel'}:${value}`}>{value}</a>

      <CopyButton
        label={`Copy pharmacy ${type}: ${value}`}
        onClick={() => void copy()}
      />
    </span>
  );
}

//===================================================================

const COMPARABLE: readonly {
  label: string;
  key: keyof Omit<
    PharmacyPendingModeration,
    'location' | 'bankDetails' | 'documents'
  >;
}[] = [
  { label: 'Name', key: 'name' },
  { label: 'Phone', key: 'phone' },
  { label: 'Email', key: 'email' },
  { label: 'Photo', key: 'imageUrl' },
  { label: 'Short description', key: 'shortDescription' },
  { label: 'About pharmacy', key: 'description' },
];

//===================================================================

function PendingChanges({
  pending,
  pharmacy,
}: {
  pending: PharmacyPendingModeration;
  pharmacy: MyPharmacyProfile;
}) {
  const changed: Array<{
    label: string;
    published?: string | null;
    submitted?: string | null;
  }> = COMPARABLE.filter(({ key }) => key in pending).map(({ key, label }) => ({
    label,
    published: pharmacy[key],
    submitted: pending[key],
  }));

  for (const key of ['region', 'settlement', 'address'] as const) {
    if (pending.location && key in pending.location)
      changed.push({
        label:
          key === 'address'
            ? 'Pharmacy address'
            : key === 'region'
              ? 'Region'
              : 'Settlement',

        published: pharmacy.location?.[key],
        submitted: pending.location[key],
      });
  }

  return (
    <section className={css.sectionCard} aria-label="Submitted changes">
      <div className={css.sectionHeading}>
        <ShieldCheck size={20} />
        <h3>Published data / Submitted changes</h3>
      </div>

      <p className={css.muted}>
        Proposed changes are not public until approved by an administrator.
      </p>
      {changed.length ||
      pending.workingHours !== undefined ||
      pending.bankDetails ||
      pending.documents ? (
        <dl className={css.compareGrid}>
          {changed.map(({ label, published, submitted }) => (
            <div className={css.compareRow} key={label}>
              <dt>
                {label}
                <span>Changed · not approved</span>
              </dt>
              <dd>
                <small>Published data</small>
                {show(published)}
              </dd>
              <dd>
                <small>Submitted changes</small>
                {show(submitted)}
              </dd>
            </div>
          ))}

          {pending.workingHours !== undefined && (
            <div className={css.compareRow}>
              <dt>Working hours (managed in Pharmacy data)</dt>
              <dd>
                <small>Published data</small>
                {show(pharmacy.workingHours)}
              </dd>
              <dd>
                <small>Submitted changes</small>
                {show(pending.workingHours)}
              </dd>
            </div>
          )}

          {pending.bankDetails && (
            <div className={css.compareRow}>
              <dt>Payment details</dt>
              <dd>Published details are retained</dd>
              <dd>Payment changes submitted for review</dd>
            </div>
          )}

          {pending.documents && (
            <div className={css.compareRow}>
              <dt>Documents</dt>
              <dd>Current verification documents</dd>
              <dd>{pending.documents.length} submitted documents</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className={css.muted}>
          There are no submitted profile fields to compare.
        </p>
      )}
    </section>
  );
}

//===================================================================

function Information({ detail }: { detail: OwnedPharmacyDetailResponse }) {
  const { pharmacy, dates } = detail;

  return (
    <div className={css.infoStack}>
      <div className={css.identityGrid}>
        <section
          className={css.photoCard}
          aria-label="Published pharmacy photo"
        >
          <Photo url={pharmacy.imageUrl} name={pharmacy.name || 'Pharmacy'} />
        </section>

        <section
          className={css.sectionCard}
          aria-label="Published pharmacy details"
        >
          <dl className={css.details}>
            <Field label="Pharmacy status">
              <StatusBadge {...PHARMACY_STATUS_PRESENTATION[pharmacy.status]} />
            </Field>

            <Field label="Pharmacy ID">{pharmacy.id}</Field>

            <Field label="Phone">
              <Contact value={pharmacy.phone} type="phone" />
            </Field>

            <Field label="Email">
              <Contact value={pharmacy.email} type="email" />
            </Field>

            <Field label="Country code">
              {show(pharmacy.location?.countryCode)}
            </Field>

            <Field label="Region">{show(pharmacy.location?.region)}</Field>

            <Field label="Settlement">
              {show(pharmacy.location?.settlement)}
            </Field>

            <Field label="Pharmacy address">
              {show(pharmacy.location?.address)}
            </Field>

            <Field label="Created at">
              <DateValue value={dates.createdAt} />
            </Field>

            <Field label="Last edited">
              <DateValue value={dates.updatedAt} />
            </Field>
          </dl>
        </section>
      </div>

      <section className={css.sectionCard} aria-label="Pharmacy verification">
        <ProfileSectionHeader
          title="Verification and administrator feedback"
          description="Review progress, administrator decisions and requested corrections."
          icon={<ShieldCheck size={21} />}
        />

        <dl className={css.details}>
          <Field label="Submitted for verification">
            <DateValue value={dates.submittedAt} />
          </Field>

          <Field label="Approved at">
            <DateValue value={dates.approvedAt} />
          </Field>

          <Field label="Activated at">
            <DateValue value={dates.activatedAt} />
          </Field>

          <Field label="Review state">
            {pharmacy.reviewState === 'changes_requested'
              ? 'Changes requested'
              : pharmacy.reviewState === 'pending'
                ? 'Awaiting administrator review'
                : '—'}
          </Field>

          <Field label="Last reviewed">
            <DateValue value={pharmacy.reviewedAt} />
          </Field>

          <Field label="Administrator feedback">
            {show(pharmacy.reviewFeedback)}
          </Field>

          <Field label="Status reason">{show(pharmacy.statusReason)}</Field>
        </dl>
      </section>
      {pharmacy.pendingModeration ? (
        <PendingChanges
          pending={pharmacy.pendingModeration}
          pharmacy={pharmacy}
        />
      ) : null}
    </div>
  );
}

//===================================================================

function About({ pharmacy }: { pharmacy: MyPharmacyProfile }) {
  return (
    <div className={css.formStack}>
      <PharmacyAboutFields value={pharmacy.description ?? ''} disabled />
      {pharmacy.pendingModeration?.description !== undefined && (
        <section className={css.pendingSection}>
          <h3>Submitted description · Pending review</h3>
          <p className={css.muted}>
            The proposal does not replace the published description until
            approved.
          </p>
          {pharmacy.pendingModeration.description?.trim() ? (
            <MarkdownContent value={pharmacy.pendingModeration.description} />
          ) : (
            <p>The submitted change will clear the description.</p>
          )}
        </section>
      )}
    </div>
  );
}

//===================================================================

function Payment({ pharmacy }: { pharmacy: MyPharmacyProfile }) {
  if (pharmacy.membershipRole !== 'owner')
    return (
      <ProfileResourceState
        variant="empty"
        title="Payment details are private"
        description="Only the pharmacy owner can view bank details."
      />
    );

  const bank = pharmacy.bankDetails;

  const published: Record<
    keyof EditablePharmacyBankDetails,
    string | undefined
  > = {
    recipientName: bank?.recipientName,
    taxId: bank?.taxId,
    iban: bank?.iban,
    bankName: bank?.bankName,
    receiptEmail: bank?.receiptEmail,
    paymentPurpose: bank?.paymentPurpose,
  };

  return (
    <div className={css.formStack}>
      <PharmacyPaymentFields
        disabled
        values={{
          recipientName: bank?.recipientName ?? '',
          taxId: bank?.taxId ?? '',
          iban: bank?.iban ?? '',
          bankName: bank?.bankName ?? '',
          receiptEmail: bank?.receiptEmail ?? '',
          paymentPurpose: bank?.paymentPurpose ?? '',
        }}
      />
      {pharmacy.pendingModeration?.bankDetails && (
        <section className={css.pendingSection}>
          <h3>Submitted payment changes · Pending review</h3>
          <p className={css.muted}>
            Approved details remain unchanged until moderation.
          </p>

          <dl className={css.details}>
            {Object.entries(pharmacy.pendingModeration.bankDetails).map(
              ([key, value]) => (
                <Field key={key} label={key.replace(/([A-Z])/g, ' $1')}>
                  <span className={css.comparisonLabels}>
                    Published:{' '}
                    {show(published[key as keyof EditablePharmacyBankDetails])}
                  </span>
                  <span className={css.comparisonLabels}>
                    Submitted: {show(value)}
                  </span>
                </Field>
              )
            )}
          </dl>
        </section>
      )}
    </div>
  );
}

//===================================================================

type DocumentPreview = Readonly<{
  url: string;
  name: string;
  kind: 'image' | 'pdf';
}>;

//===================================================================

const PREVIEW_TYPES: Readonly<Record<string, DocumentPreview['kind']>> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
};

//===================================================================

function Documents({
  pharmacy,
  pharmacyId,
}: {
  pharmacy: MyPharmacyProfile;
  pharmacyId: string;
}) {
  const toast = useToast();
  const [preview, setPreview] = useState<DocumentPreview | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const downloadsRef = useRef(new Set<AbortController>());
  const urlsRef = useRef(new Set<string>());

  useEffect(() => {
    const requests = downloadsRef.current;
    const urls = urlsRef.current;

    return () => {
      for (const controller of requests) controller.abort();
      for (const url of urls) URL.revokeObjectURL(url);

      requests.clear();
      urls.clear();
    };
  }, [pharmacyId]);

  const documents = [
    ...pharmacy.documents.map((doc) => ({
      ...doc,
      source: 'published' as const,
    })),

    ...(pharmacy.pendingModeration?.documents ?? []).map((doc) => ({
      ...doc,
      source: 'pending' as const,
    })),
  ];

  const files: BrowserUploadFile[] = documents.map((doc) => ({
    id: doc.id,
    documentId: doc.id,
    name: doc.name,
    size: doc.size,
    type: doc.type,
  }));

  const loadFile = async (documentId: string): Promise<Blob | null> => {
    const controller = new AbortController();

    downloadsRef.current.add(controller);

    try {
      const blob = await downloadOwnedPharmacyDocument(pharmacyId, documentId, {
        signal: controller.signal,
      });

      return controller.signal.aborted ? null : blob;
    } catch {
      if (!controller.signal.aborted)
        toast.error('Could not open the private document. Please try again.');

      return null;
    } finally {
      downloadsRef.current.delete(controller);
    }
  };

  const registerUrl = (blob: Blob): string => {
    const url = URL.createObjectURL(blob);

    urlsRef.current.add(url);

    return url;
  };

  const closePreview = () => {
    setPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
        urlsRef.current.delete(current.url);
      }

      return null;
    });
  };

  const openPreview = async (file: (typeof documents)[number]) => {
    if (previewLoadingId) return;

    const kind = PREVIEW_TYPES[file.type.toLowerCase()];

    if (!kind) return;

    setPreviewLoadingId(file.id);

    try {
      const blob = await loadFile(file.id);

      if (!blob) return;

      // Prevent browsers from rendering arbitrary HTML/SVG from private uploads.
      const url = registerUrl(
        new Blob([blob], { type: file.type.toLowerCase() })
      );

      closePreview();
      setPreview({ url, name: file.name, kind });
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const downloadFile = async (file: BrowserUploadFile): Promise<string> => {
    if (!file.documentId) return '';

    const blob = await loadFile(file.documentId);

    if (!blob) return '';

    const url = registerUrl(blob);

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(url);
    }, 60_000);
    return url;
  };

  return (
    <>
      <DocumentsPanel
        id="owned-pharmacy-detail-documents"
        name="pharmacyDocuments"
        title="Pharmacy documents"
        description="Published and submitted documents. Manage them in the pharmacy editor when available."
        headerIcon={<Files size={22} />}
        value={files}
        editable={false}
        readOnlyUploadView
        maxFiles={PHARMACY_DOCUMENT_RULES.maxFiles}
        accept={PHARMACY_DOCUMENT_ACCEPT}
        emptyTitle="No pharmacy documents"
        emptyText="No published or submitted documents for this pharmacy."
        beforeDocuments={
          documents.length ? (
            <ul
              className={css.documentDetails}
              aria-label="Document sources and preview"
            >
              {documents.map((file) => (
                <li
                  key={`${file.source}:${file.id}`}
                  className={css.documentDetail}
                >
                  <div className={css.documentText}>
                    <strong>{file.name}</strong>
                    <span>
                      {file.source === 'pending'
                        ? 'Submitted changes'
                        : 'Published'}{' '}
                      · {file.type} · {formatDateTime(file.uploadedAt) ?? '—'}
                    </span>
                  </div>
                  {PREVIEW_TYPES[file.type.toLowerCase()] ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      iconLeft={<Eye size={16} aria-hidden="true" />}
                      disabled={Boolean(previewLoadingId)}
                      isLoading={previewLoadingId === file.id}
                      onClick={() => void openPreview(file)}
                    >
                      Preview
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null
        }
        onDownloadFile={downloadFile}
      />

      <ModalBase
        isOpen={Boolean(preview)}
        ariaLabel={preview ? `Preview ${preview.name}` : 'Document preview'}
        onClose={closePreview}
        dialogClassName={css.previewDialog}
      >
        {preview ? (
          <div className={css.previewContent}>
            <div className={css.previewHeader}>
              <strong>{preview.name}</strong>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={closePreview}
              >
                <X size={18} aria-hidden="true" /> Close
              </Button>
            </div>
            {preview.kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt={preview.name}
                className={css.previewImage}
              />
            ) : (
              <iframe
                title={`PDF preview of ${preview.name}`}
                src={preview.url}
                sandbox="allow-scripts"
                className={css.previewFrame}
              />
            )}
          </div>
        ) : null}
      </ModalBase>
    </>
  );
}

//===================================================================

/** Documents use their own scoped resource, just like the Admin documents tab. */
function DocumentsResource({ pharmacyId }: { pharmacyId: string }) {
  const [version, setVersion] = useState(0);

  const [result, setResult] = useState<Readonly<{
    pharmacyId: string;
    version: number;
    pharmacy: MyPharmacyProfile | null;
    failed: boolean;
  }> | null>(null);

  useEffect(() => {
    let active = true;

    void getOwnedPharmacyProfile(pharmacyId)
      .then(({ pharmacy }) => {
        if (active) setResult({ pharmacyId, version, pharmacy, failed: false });
      })

      .catch(() => {
        if (active)
          setResult({ pharmacyId, version, pharmacy: null, failed: true });
      });

    return () => {
      active = false;
    };
  }, [pharmacyId, version]);

  const current =
    result?.pharmacyId === pharmacyId && result?.version === version
      ? result
      : null;

  return current?.pharmacy ? (
    <Documents pharmacy={current.pharmacy} pharmacyId={pharmacyId} />
  ) : current?.failed ? (
    <ProfileResourceState
      variant="error"
      title="Pharmacy documents could not be loaded"
      description="The private document list is unavailable."
      retryLabel="Retry documents"
      onRetry={() => setVersion((v) => v + 1)}
    />
  ) : (
    <ProfileResourceState
      variant="loading"
      title="Loading pharmacy documents"
      description="Checking the pharmacy’s attached files."
    />
  );
}

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
