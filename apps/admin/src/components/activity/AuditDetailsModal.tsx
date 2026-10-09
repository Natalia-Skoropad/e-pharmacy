'use client';

import {
  CalendarClock,
  Fingerprint,
  FilePenLine,
  History,
  ListChecks,
  MessageSquareText,
  RefreshCw,
  Shapes,
  UserRound,
} from 'lucide-react';

import { DataTable, type DataTableColumn } from '@e-pharmacy/ui/data-display';
import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';
import { CloseIconButton } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import type {
  AdminAuditActor,
  AdminAuditDetails,
} from '@/lib/audit/admin-audit';

import {
  formatAdminAuditValue,
  getAdminAuditActionLabel,
  getAdminAuditChangeTone,
  getAdminAuditStatusPresentation,
} from '@/lib/audit/admin-audit-presentation';

import {
  getAdminAuditFieldLabel,
  getAuditColorSwatch,
} from '@/lib/audit/admin-audit-fields';

import type { AdminAuditValue } from '@/lib/audit/admin-audit';

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
}>;

//===================================================================

function RenderAuditValue({
  value,
  isStatus = false,
}: Readonly<{ value: AdminAuditValue | undefined; isStatus?: boolean }>) {
  const color = getAuditColorSwatch(value);

  const status =
    isStatus && typeof value === 'string'
      ? getAdminAuditStatusPresentation(value)
      : null;

  return (
    <span className={css.changeValue}>
      {color ? (
        <span
          className={css.colorSwatch}
          style={{ backgroundColor: color }}
          aria-label={`Color ${color}`}
        />
      ) : null}
      {status ? <StatusBadge {...status} /> : formatAdminAuditValue(value)}
    </span>
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
    render: (item) => (
      <RenderAuditValue
        value={item.before}
        isStatus={item.field === 'status' || item.field.endsWith('.status')}
      />
    ),
  },
  {
    key: 'after',
    title: 'After',
    width: '25%',
    render: (item) => (
      <RenderAuditValue
        value={item.after}
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
  const tone = details ? getAdminAuditChangeTone(details) : 'info';
  const toneClassName = getChangeToneClassName(tone);

  const changeRows: AuditChangeRow[] = details
    ? details.changedFields.map((field) => ({
        field,
        label: getAdminAuditFieldLabel(field),
        before: details.before[field],
        after: details.after[field],
      }))
    : [];

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
                    {getAdminAuditActionLabel(details.action)}
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
                  {details.reason ? <span>{details.reason}</span> : null}
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
