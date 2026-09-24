'use client';

import { Button } from '@e-pharmacy/ui/primitives';
import { ModalBase } from '@e-pharmacy/ui/overlays';

import type { AdminAuditDetails } from '@/lib/audit/admin-audit';

import {
  formatAdminAuditValue,
  getAdminAuditActionLabel,
  getAdminAuditEntityLabel,
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

  return (
    <ModalBase
      isOpen={isOpen}
      labelledBy={titleId}
      dialogClassName={css.detailsDialog}
      onClose={onClose}
    >
      <div className={css.detailsHeader}>
        <div>
          <p className={css.eyebrow}>Activity history</p>
          <h2 id={titleId}>Audit details</h2>
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {isLoading ? (
        <p className={css.detailsState} aria-live="polite">
          Loading audit details...
        </p>
      ) : error ? (
        <div className={css.detailsState} role="alert">
          <p>{error}</p>
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
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
              <dt>Action</dt>
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
                <span aria-hidden="true">→</span>
                <span>{formatAdminAuditValue(details.after[field])}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </ModalBase>
  );
}
