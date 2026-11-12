'use client';

import { useEffect, useState } from 'react';

import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  FilePenLine,
  History,
  ListChecks,
  MessageSquareText,
  RefreshCw,
  Shapes,
  UserRound,
} from 'lucide-react';

import {
  DataTable,
  MarkdownContent,
  WorkingHours,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';
import { Button, CloseIconButton } from '@e-pharmacy/ui/primitives';

import {
  PharmacyBlockSourceBadge,
  StatusBadge,
} from '@e-pharmacy/ui/statistics';

import { ShimmerImage } from '@e-pharmacy/ui/media';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import type {
  AdminAuditActor,
  AdminAuditDetails,
} from '@/lib/audit/admin-audit';

import {
  formatAdminAuditValue,
  getAdminAuditDisplayType,
  getAdminAuditChangeTone,
  getAdminAuditStatusPresentation,
} from '@/lib/audit/admin-audit-presentation';

import {
  getAdminAuditChangedFieldLabel,
  getAuditColorSwatch,
} from '@/lib/audit/admin-audit-fields';

import type { AdminAuditValue } from '@/lib/audit/admin-audit';
import { getAdminPharmacyComments } from '@/lib/api/browser/admin-pharmacy-detail.api';

import { ActivityActorIdentity } from './ActivityActorIdentity';
import { ActivityPageLink, ActivitySectionLink } from './ActivitySectionLink';

import css from './ActivityHistory.module.css';

//===================================================================

type AuditDetailsModalProps = Readonly<{
  isOpen: boolean;
  details: AdminAuditDetails | null;
  actor: AdminAuditActor | null;
  pagePhotoUrl?: string;
  pageName?: string;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}>;

type AuditChangeRow = Readonly<{
  field: string;
  label: string;
  before: AdminAuditValue | undefined;
  after: AdminAuditValue | undefined;
  deletedDraft?: boolean;
  beforeStatus?: string;
  afterStatus?: string;
  beforeBlockSource?: 'owner_deactivated' | 'admin_blocked';
  afterBlockSource?: 'owner_deactivated' | 'admin_blocked';
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
}>;

//===================================================================

function AuditLongText({ value }: Readonly<{ value: string }>) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = value.length > 180 || value.split('\n').length > 5;

  return (
    <div className={css.auditLongText}>
      <div
        className={[
          css.auditTextContent,
          !expanded && canExpand ? css.auditTextCollapsed : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <MarkdownContent value={value} />
      </div>
      {canExpand ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          fullWidth
          className={css.auditExpandButton}
          iconLeft={
            expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />
          }
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      ) : null}
    </div>
  );
}

//===================================================================

function RenderAuditValue({
  value,
  field,
  isStatus = false,
  photoUrl,
  blockSource,
}: Readonly<{
  value: AdminAuditValue | undefined;
  field: string;
  isStatus?: boolean;
  photoUrl?: string | null;
  blockSource?: 'owner_deactivated' | 'admin_blocked';
}>) {
  const color = getAuditColorSwatch(value);

  const status =
    isStatus && typeof value === 'string'
      ? getAdminAuditStatusPresentation(value)
      : null;

  return (
    <div className={css.changeValue}>
      {color ? (
        <span
          className={css.colorSwatch}
          style={{ backgroundColor: color }}
          aria-label={`Color ${color}`}
        />
      ) : null}
      {field === 'photoFingerprint' ? (
        photoUrl ? (
          <span className={css.auditPhotoPreview}>
            <ShimmerImage
              src={photoUrl}
              alt="Pharmacy photo at this change"
              sizes="110px"
              unoptimized
            />
          </span>
        ) : (
          <span className={css.auditPhotoUnavailable}>
            {value === null
              ? 'No pharmacy photo'
              : 'Historical photo preview unavailable'}
          </span>
        )
      ) : status ? (
        <>
          <StatusBadge {...status} />
          <PharmacyBlockSourceBadge
            status={typeof value === 'string' ? value : ''}
            blockSource={blockSource}
          />
        </>
      ) : field === 'workingHours' &&
        typeof value === 'string' &&
        value.trim() ? (
        <WorkingHours value={value} />
      ) : ['description', 'shortDescription', 'text'].includes(field) &&
        typeof value === 'string' ? (
        <AuditLongText value={value} />
      ) : (
        formatAdminAuditValue(value)
      )}
    </div>
  );
}

//===================================================================

const CHANGE_COLUMNS: readonly DataTableColumn<AuditChangeRow>[] = [
  {
    key: 'label',
    title: 'Changed field',
    width: '27%',
    render: (item) => <span className={css.changeFieldName}>{item.label}</span>,
  },
  {
    key: 'field',
    title: 'Field',
    width: '23%',
    render: (item) => (
      <code className={css.changeDeveloperField}>{item.field}</code>
    ),
  },
  {
    key: 'before',
    title: 'Before',
    width: '25%',

    render: (item) =>
      item.field === 'reviewState' && item.beforeStatus ? (
        <div className={css.changeValue}>
          <RenderAuditValue
            value={item.beforeStatus}
            field="status"
            isStatus
            blockSource={item.beforeBlockSource}
          />
          {item.before === 'changes_requested' ? (
            <StatusBadge label="Needs changes" tone="neutral" />
          ) : null}
        </div>
      ) : item.deletedDraft ? (
        <StatusBadge {...getAdminAuditStatusPresentation('new')!} />
      ) : (
        <RenderAuditValue
          value={item.before}
          photoUrl={item.beforePhotoUrl}
          blockSource={item.beforeBlockSource}
          field={item.field}
          isStatus={item.field === 'status' || item.field.endsWith('.status')}
        />
      ),
  },
  {
    key: 'after',
    title: 'After',
    width: '25%',

    render: (item) =>
      item.field === 'reviewState' && item.afterStatus ? (
        <div className={css.changeValue}>
          <RenderAuditValue
            value={item.afterStatus}
            field="status"
            isStatus
            blockSource={item.afterBlockSource}
          />
          {item.after === 'changes_requested' ? (
            <StatusBadge label="Needs changes" tone="neutral" />
          ) : null}
        </div>
      ) : item.deletedDraft ? (
        <span className={css.changeValue}>Pharmacy delete</span>
      ) : (
        <RenderAuditValue
          value={item.after}
          photoUrl={item.afterPhotoUrl}
          blockSource={item.afterBlockSource}
          field={item.field}
          isStatus={item.field === 'status' || item.field.endsWith('.status')}
        />
      ),
  },
];

//===================================================================

function getChangeToneClassName(
  tone: ReturnType<typeof getAdminAuditChangeTone>
): string {
  if (tone === 'success') return css.changeSuccess;
  if (tone === 'danger') return css.changeDanger;
  if (tone === 'mustard') return css.changeMustard;
  if (tone === 'pending') return css.changePending;
  if (tone === 'warning') return css.changeWarning;
  if (tone === 'neutral') return css.changeNeutral;

  return css.changeInfo;
}

//===================================================================

export function AuditDetailsModal({
  isOpen,
  details,
  actor,
  pagePhotoUrl,
  pageName,
  isLoading,
  error,
  onClose,
  onRetry,
}: AuditDetailsModalProps) {
  const titleId = 'admin-audit-details-title';

  // For old admin-comment entries the body was never persisted in audit.
  // Resolve an existing comment through the same protected Admin endpoint
  // instead of pretending that history contains data it never stored.
  const [commentText, setCommentText] = useState<{
    auditId: string;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (
      !isOpen ||
      !details ||
      details.action !== 'pharmacy.comment.created' ||
      typeof details.after.text === 'string'
    )
      return;

    const pharmacyId =
      details.pharmacyId ??
      (details.scopeEntityType === 'pharmacy'
        ? details.scopeEntityId
        : undefined);

    if (!pharmacyId) return;

    const controller = new AbortController();

    void getAdminPharmacyComments(pharmacyId, { signal: controller.signal })
      .then(({ comments }) => {
        const comment = comments.find((item) => item.id === details.entityId);

        if (!controller.signal.aborted && comment) {
          setCommentText({ auditId: details.id, text: comment.text });
        }
      })
      .catch(() => {
        // Historical or deleted comments may no longer be available.
      });

    return () => controller.abort();
  }, [details, isOpen]);

  const tone = details ? getAdminAuditChangeTone(details) : 'info';
  const toneClassName = getChangeToneClassName(tone);

  // Older records can contain both the technical status and reviewState
  // fields, or the previous administrator feedback cleared by an owner.
  // Display one meaningful lifecycle transition without changing stored logs.
  const reviewFields = details?.changedFields ?? [];

  const visibleFields = reviewFields.filter((field) => {
    if (details?.entityType !== 'pharmacy') return true;

    // Legacy revision tokens and section bookkeeping are internal audit
    // metadata, never a user-visible field change.
    if (field === 'revision' || field === 'editedSections') return false;

    // Creation is a lifecycle event. 'exists: No -> Yes' is internal metadata,
    // not a second data change in the user-facing Changes table.
    if (details.action === 'pharmacy.created' && field === 'exists')
      return false;

    if (field === 'status' && reviewFields.includes('reviewState'))
      return false;

    // Approval and blocking clear internal request metadata. These are not
    // separate user-facing changes; the transition and reason are shown once.
    if (
      (reviewFields.includes('status') ||
        reviewFields.includes('reviewState')) &&
      (field === 'blockSource' ||
        (field === 'statusReason' && details.after.statusReason === null))
    )
      return false;

    // The blocking reason is already shown in Reason / description.
    if (
      field === 'statusReason' &&
      typeof details.reason === 'string' &&
      typeof details.after.statusReason === 'string' &&
      details.after.statusReason.trim() === details.reason.trim()
    )
      return false;

    // The admin's decision reason is already displayed once above Changes.
    // Preserve a distinct feedback edit, but do not repeat identical content.
    if (
      field === 'reviewFeedback' &&
      typeof details?.reason === 'string' &&
      typeof details.after.reviewFeedback === 'string' &&
      details.after.reviewFeedback.trim() === details.reason.trim()
    )
      return false;

    // Feedback belongs to the request-corrections decision that created it.
    // Do not present its later cleanup as a new owner/admin status change.
    if (
      field === 'reviewFeedback' &&
      details?.action !== 'pharmacy.corrections.requested'
    ) {
      return false;
    }

    return true;
  });

  // Older verification resubmissions can have only reviewState in audit
  // snapshots (changes_requested -> pending), with no unchanged status.
  // Infer the familiar verification status for those historic entries.
  const legacyResubmission =
    details?.entityType === 'pharmacy' &&
    details.action === 'pharmacy.moderation.submitted' &&
    details.before.reviewState === 'changes_requested' &&
    details.after.reviewState === 'pending' &&
    !details.before.status &&
    !details.after.status;

  const reviewStatusFallback =
    legacyResubmission || details?.action === 'pharmacy.corrections.requested'
      ? 'on_verification'
      : undefined;

  const canInferSameStatus =
    legacyResubmission || details?.action === 'pharmacy.corrections.requested';

  const storedBeforeStatus =
    details && typeof details.before.status === 'string'
      ? details.before.status
      : undefined;

  const storedAfterStatus =
    details && typeof details.after.status === 'string'
      ? details.after.status
      : undefined;

  const beforeStatus =
    storedBeforeStatus ??
    details?.statusBefore ??
    (canInferSameStatus
      ? (storedAfterStatus ?? reviewStatusFallback)
      : undefined);

  const afterStatus =
    storedAfterStatus ??
    details?.statusAfter ??
    (canInferSameStatus
      ? (storedBeforeStatus ?? reviewStatusFallback)
      : undefined);

  const inferredAfterBlockSource =
    details?.entityType === 'pharmacy' &&
    details.action === 'pharmacy.status.changed' &&
    (details.after.status === 'blocked' || details.statusAfter === 'blocked')
      ? actor?.actorType === 'pharmacyOwner'
        ? 'owner_deactivated'
        : actor?.actorType === 'employee'
          ? 'admin_blocked'
          : undefined
      : undefined;

  const changeRows: AuditChangeRow[] = details
    ? visibleFields.map((field) => ({
        field,

        label:
          field === 'reviewState' && details.entityType === 'pharmacy'
            ? 'Pharmacy status'
            : getAdminAuditChangedFieldLabel(field, details.entityType),

        beforeStatus,
        afterStatus,

        ...(details.entityType === 'pharmacy' &&
        (details.before.blockSource === 'owner_deactivated' ||
          details.before.blockSource === 'admin_blocked')
          ? { beforeBlockSource: details.before.blockSource }
          : {}),

        ...(details.entityType === 'pharmacy' &&
        (details.after.blockSource === 'owner_deactivated' ||
          details.after.blockSource === 'admin_blocked')
          ? { afterBlockSource: details.after.blockSource }
          : inferredAfterBlockSource
            ? { afterBlockSource: inferredAfterBlockSource }
            : {}),

        before: details.before[field],
        after: details.after[field],

        ...(field === 'photoFingerprint'
          ? {
              beforePhotoUrl:
                typeof details.before.photoPreviewUrl === 'string'
                  ? details.before.photoPreviewUrl
                  : null,

              afterPhotoUrl:
                typeof details.after.photoPreviewUrl === 'string'
                  ? details.after.photoPreviewUrl
                  : null,
            }
          : {}),

        deletedDraft:
          details.action === 'pharmacy.deleted' && field === 'exists',
      }))
    : [];

  if (
    details?.entityType === 'pharmacy' &&
    details.action === 'pharmacy.created' &&
    !changeRows.some((row) => row.field === 'status')
  ) {
    changeRows.unshift({
      field: 'status',
      label: 'Pharmacy status',
      before: null,
      after: 'new',
    });
  }

  if (
    details?.action === 'pharmacy.comment.created' &&
    !details.changedFields.includes('text') &&
    commentText?.auditId === details.id
  ) {
    changeRows.push({
      field: 'text',
      label: 'Comment text',
      before: null,
      after: commentText.text,
    });
  }

  return (
    <ModalRoot>
      <ModalBase
        isOpen={isOpen}
        labelledBy={titleId}
        dialogClassName={css.detailsDialog}
        onClose={onClose}
      >
        <div className={css.detailsHeader}>
          <div className={css.detailsHeaderCopy}>
            <span className={css.detailsHeaderIcon} aria-hidden="true">
              <History size={22} />
            </span>

            <span className={css.detailsHeadingText}>
              <span className={css.detailsKicker}>Activity history</span>
              <h2 className={css.detailsTitle} id={titleId}>
                Audit details
              </h2>
            </span>
          </div>

          <CloseIconButton label="Close audit details" onClick={onClose} />
        </div>

        {isLoading ? (
          <ProfileResourceState
            variant="loading"
            title="Loading audit details"
            description="Please wait while the audit record and its change history are loaded."
          />
        ) : error ? (
          <ProfileResourceState
            variant="error"
            title="Audit details could not be loaded"
            description={error}
            retryLabel="Retry"
            onRetry={onRetry}
          />
        ) : details ? (
          <div className={css.detailsBody}>
            <dl className={css.detailsMeta}>
              <div className={css.detailsMetaItem}>
                <dt>
                  <CalendarClock size={16} aria-hidden="true" />
                  Date and time
                </dt>
                <dd>
                  <time dateTime={details.createdAt}>
                    {new Intl.DateTimeFormat('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    }).format(new Date(details.createdAt))}
                  </time>
                </dd>
              </div>

              <div className={css.detailsMetaItem}>
                <dt>
                  <UserRound size={16} aria-hidden="true" />
                  Changed by
                </dt>
                <dd>
                  <ActivityActorIdentity
                    actor={actor}
                    actorNameSnapshot={details.actorNameSnapshot}
                    showPhoto
                    photoSize={34}
                    statusPlacement="inline"
                  />
                </dd>
              </div>

              <div className={css.detailsMetaItem}>
                <dt>
                  <RefreshCw size={16} aria-hidden="true" />
                  Change type
                </dt>
                <dd className={css.detailsActionCopy}>
                  <strong
                    className={`${css.detailsActionPill} ${toneClassName}`}
                  >
                    {getAdminAuditDisplayType(details.action)}
                  </strong>
                </dd>
              </div>

              <div className={css.detailsMetaItem}>
                <dt>
                  <Shapes size={16} aria-hidden="true" />
                  Entity
                </dt>
                <dd>{details.entityLabelSnapshot}</dd>
              </div>

              <div className={css.detailsMetaItem}>
                <dt>
                  <FilePenLine size={16} aria-hidden="true" />
                  Link to section
                </dt>
                <dd>
                  <ActivitySectionLink item={details} />
                </dd>
              </div>
              <div className={css.detailsMetaItem}>
                <dt>
                  <FilePenLine size={16} aria-hidden="true" />
                  Link to page
                </dt>
                <dd>
                  <ActivityPageLink
                    item={details}
                    photoUrl={pagePhotoUrl}
                    pageName={pageName}
                  />
                </dd>
              </div>
              <div className={css.detailsMetaItem}>
                <dt>
                  <Fingerprint size={16} aria-hidden="true" />
                  Entity ID
                </dt>
                <dd className={css.codeValue}>{details.entityId}</dd>
              </div>
              <div className={css.detailsMetaItem}>
                <dt>
                  <Fingerprint size={16} aria-hidden="true" />
                  Request ID
                </dt>
                <dd className={css.codeValue}>{details.requestId}</dd>
              </div>
            </dl>

            {details.reason ? (
              <section className={css.detailsReason} aria-label="Change reason">
                <span className={css.detailsReasonIcon} aria-hidden="true">
                  <MessageSquareText size={18} />
                </span>
                <span className={css.detailsReasonCopy}>
                  <strong>Reason / description</strong>
                  {details.reason ? (
                    <AuditLongText value={details.reason} />
                  ) : null}
                </span>
              </section>
            ) : null}

            <section
              className={css.changes}
              aria-labelledby="audit-changes-title"
            >
              <div className={css.changesHeading}>
                <span className={css.changesHeadingIcon} aria-hidden="true">
                  <ListChecks size={18} />
                </span>
                <h3 id="audit-changes-title">Changes</h3>
              </div>

              <DataTable
                columns={CHANGE_COLUMNS}
                items={changeRows}
                getItemKey={(item) => item.field}
                minWidth={650}
                ariaLabel="Audit changes"
                labels={{ empty: 'No field-level changes were recorded.' }}
              />
            </section>
          </div>
        ) : null}
      </ModalBase>
    </ModalRoot>
  );
}
