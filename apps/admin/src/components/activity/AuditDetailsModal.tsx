'use client';

import {
  CalendarClock,
  Fingerprint,
  History,
  ListChecks,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Shapes,
  UserRound,
} from 'lucide-react';

import { DataTable, type DataTableColumn } from '@e-pharmacy/ui/data-display';
import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';
import { CloseIconButton, TextActionButton } from '@e-pharmacy/ui/primitives';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import type { AdminAuditDetails } from '@/lib/audit/admin-audit';

import {
  formatAdminAuditValue,
  getAdminAuditActionLabel,
  getAdminAuditChangeTone,
  getAdminAuditEntityLabel,
  getAdminAuditLocation,
  getAdminAuditStatusTransitionLabel,
} from '@/lib/audit/admin-audit-presentation';

import css from './ActivityHistory.module.css';

//===================================================================

type AuditDetailsModalProps = Readonly<{
  isOpen: boolean;
  details: AdminAuditDetails | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}>;

type AuditChangeRow = Readonly<{
  field: string;
  before: string;
  after: string;
}>;

//===================================================================

const CHANGE_COLUMNS: readonly DataTableColumn<AuditChangeRow>[] = [
  {
    key: 'field',
    title: 'Field',
    width: '30%',
    render: (item) => (
      <strong className={css.changeFieldName}>{item.field}</strong>
    ),
  },
  {
    key: 'before',
    title: 'Before',
    width: '35%',
    render: (item) => <span className={css.changeValue}>{item.before}</span>,
  },
  {
    key: 'after',
    title: 'After',
    width: '35%',
    render: (item) => <span className={css.changeValue}>{item.after}</span>,
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
  isLoading,
  error,
  onClose,
  onRetry,
}: AuditDetailsModalProps) {
  const titleId = 'admin-audit-details-title';
  const location = details ? getAdminAuditLocation(details) : null;
  const tone = details ? getAdminAuditChangeTone(details) : 'info';
  const toneClassName = getChangeToneClassName(tone);
  const statusTransition = details
    ? getAdminAuditStatusTransitionLabel(details)
    : null;

  const changeRows: AuditChangeRow[] = details
    ? details.changedFields.map((field) => ({
        field,
        before: formatAdminAuditValue(details.before[field]),
        after: formatAdminAuditValue(details.after[field]),
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
                <dd>{details.actorNameSnapshot}</dd>
              </div>

              <div className={css.detailsMetaItem}>
                <dt>
                  <RefreshCw size={16} aria-hidden="true" />
                  Change
                </dt>
                <dd className={css.detailsActionCopy}>
                  <strong
                    className={`${css.detailsActionPill} ${toneClassName}`}
                  >
                    {getAdminAuditActionLabel(details.action)}
                  </strong>
                  {statusTransition ? (
                    <span
                      className={`${css.detailsTransition} ${toneClassName}`}
                    >
                      {statusTransition}
                    </span>
                  ) : null}
                </dd>
              </div>

              <div className={css.detailsMetaItem}>
                <dt>
                  <Shapes size={16} aria-hidden="true" />
                  Entity
                </dt>
                <dd>
                  {getAdminAuditEntityLabel(details.entityType)} ·{' '}
                  {details.entityLabelSnapshot}
                </dd>
              </div>

              <div className={css.detailsMetaItem}>
                <dt>
                  <Fingerprint size={16} aria-hidden="true" />
                  Entity ID
                </dt>
                <dd className={css.codeValue}>{details.entityId}</dd>
              </div>

              {location ? (
                <div className={css.detailsMetaItem}>
                  <dt>
                    <MapPin size={16} aria-hidden="true" />
                    Section / page
                  </dt>
                  <dd>
                    <TextActionButton href={location.href}>
                      {location.label}
                    </TextActionButton>
                  </dd>
                </div>
              ) : null}

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
                  <span>{details.reason}</span>
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
                minWidth={560}
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
