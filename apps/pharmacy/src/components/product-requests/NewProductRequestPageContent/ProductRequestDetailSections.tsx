import { History } from 'lucide-react';

import { CountLabel } from '@e-pharmacy/ui/data-display';
import { StatusBanner, StatusBadge } from '@e-pharmacy/ui/statistics';
import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { formatDateTime } from '@e-pharmacy/utils/date';

import {
  createPharmacyNote,
  deletePharmacyNote,
  getPharmacyNotes,
} from '@/lib/api/browser';

import type { ProductRequestDetailsViewModel } from '@/lib/product-requests/product-requests';

import { EntityComments } from '@/components/comments/EntityComments';

import type { ProductRequestEditorTab } from './ProductRequestEditorPanels';

import css from './ProductRequestDetailSections.module.css';

//===================================================================

type ProductRequestDetailSectionsProps = Readonly<{
  activeEditorTab: ProductRequestEditorTab;
  request: ProductRequestDetailsViewModel | null;
  requestId?: string;
  commentsTotal: number;
  onCommentsTotalChange: (total: number) => void;
}>;

//===================================================================

export function ProductRequestDetailSections({
  activeEditorTab,
  request,
  requestId,
  commentsTotal,
  onCommentsTotalChange,
}: ProductRequestDetailSectionsProps) {
  return (
    <>
      {activeEditorTab === 'comments' ? (
        requestId ? (
          <EntityComments
            entityKey={`product-request:${requestId}`}
            presentation="profile"
            showCountWhileLoading
            title="Comments"
            description="Private working notes about this product request, visible to authorized pharmacy staff."
            emptyTitle="No internal comments yet"
            emptyText="Internal product request comments will appear here."
            initialTotal={commentsTotal}
            isEditable={
              request?.status === 'new' ||
              (request?.status === 'on_moderation' &&
                request.reviewState === 'changes_requested')
            }
            load={(page, options) =>
              getPharmacyNotes('product_request', requestId, page, options)
            }
            create={(text, options) =>
              createPharmacyNote(
                'product_request',
                requestId,
                text,
                options.clientRequestId,
                options
              )
            }
            remove={(id, options) =>
              deletePharmacyNote('product_request', requestId, id, options)
            }
            onTotalChange={onCommentsTotalChange}
          />
        ) : (
          <section className={css.detailPanel}>
            <StatusBanner
              {...PRODUCT_REQUEST_STATUS_PRESENTATION.new}
              title="Comments are not available yet"
              message="Save the request as a draft first. Private pharmacy comments will become available after the draft is created."
            />
          </section>
        )
      ) : null}

      {activeEditorTab === 'activity' && request ? (
        <section
          className={css.detailPanel}
          aria-labelledby="request-history-title"
        >
          <div className={css.historyHeader}>
            <h2 className={css.sectionTitle} id="request-history-title">
              Change history
            </h2>

            <CountLabel
              shown={request.history.length}
              total={request.history.length}
              label="history events"
            />
          </div>

          <ol className={css.historyList}>
            {[...request.history].reverse().map((entry) => {
              const toneClassName =
                entry.status === 'rejected'
                  ? css.historyDanger
                  : entry.status === 'on_moderation'
                    ? css.historyWarning
                    : entry.status === 'new'
                      ? css.historyInfo
                      : undefined;

              const description =
                entry.status === 'rejected' &&
                request.rejectionReason &&
                entry.description.trim() === request.rejectionReason.trim()
                  ? request.cancelledBy === 'owner'
                    ? 'The owner cancelled the request after Admin requested corrections.'
                    : 'Admin rejected the request because the submitted information needs correction.'
                  : entry.description;

              return (
                <li key={entry.id} className={toneClassName}>
                  <History size={18} aria-hidden="true" />
                  <div className={css.historyContent}>
                    <div className={css.historyTopRow}>
                      <div className={css.historyMeta}>
                        <strong>{entry.title}</strong>
                        {entry.isInferred ? (
                          <span className={css.historyInferred}>
                            Legacy history · exact event time unavailable
                          </span>
                        ) : (
                          <time dateTime={entry.createdAt}>
                            {formatDateTime(entry.createdAt) ?? '—'}
                          </time>
                        )}
                      </div>

                      <StatusBadge
                        {...PRODUCT_REQUEST_STATUS_PRESENTATION[entry.status]}
                      />
                    </div>

                    <p>{description}</p>

                    {entry.status === 'rejected' && request.rejectionReason ? (
                      <p className={css.historyRejectionReason}>
                        <b>
                          {request.cancelledBy === 'owner'
                            ? 'Cancellation reason:'
                            : 'Rejection reason:'}
                        </b>{' '}
                        {request.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
    </>
  );
}
