'use client';

import { CloseIconButton, TextActionButton } from '@e-pharmacy/ui/primitives';
import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import type { AdminAuditDetails } from '@/lib/audit/admin-audit';

import {
  formatAdminAuditValue,
  getAdminAuditActionLabel,
  getAdminAuditEntityLabel,
  getAdminAuditLocation,
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
            <p className={css.detailsKicker}>Activity history</p>
            <h2 className={css.detailsTitle} id={titleId}>
              Audit details
            </h2>
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
              <div>
                <dt>Date and time</dt>
                <dd>
                  <time dateTime={details.createdAt}>
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    }).format(new Date(details.createdAt))}
                  </time>
                </dd>
              </div>
              <div>
                <dt>Changed by</dt>
                <dd>{details.actorNameSnapshot}</dd>
              </div>
              <div>
                <dt>Change</dt>
                <dd>{getAdminAuditActionLabel(details.action)}</dd>
              </div>
              <div>
                <dt>Entity</dt>
                <dd>
                  {getAdminAuditEntityLabel(details.entityType)} ·{' '}
                  {details.entityLabelSnapshot}
                </dd>
              </div>
              <div>
                <dt>Entity ID</dt>
                <dd className={css.codeValue}>{details.entityId}</dd>
              </div>
              {location ? (
                <div>
                  <dt>Section / page</dt>
                  <dd>
                    <TextActionButton href={location.href}>
                      {location.label}
                    </TextActionButton>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Request ID</dt>
                <dd className={css.codeValue}>{details.requestId}</dd>
              </div>
              {details.reason ? (
                <div>
                  <dt>Reason</dt>
                  <dd>{details.reason}</dd>
                </div>
              ) : null}
            </dl>

            <div className={css.changes}>
              <h3>Changes</h3>

              {details.changedFields.map((field) => (
                <div className={css.changeRow} key={field}>
                  <strong>{field}</strong>
                  <span>{formatAdminAuditValue(details.before[field])}</span>
                  <span className={css.changeArrow} aria-hidden="true">
                    →
                  </span>
                  <span>{formatAdminAuditValue(details.after[field])}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </ModalBase>
    </ModalRoot>
  );
}
