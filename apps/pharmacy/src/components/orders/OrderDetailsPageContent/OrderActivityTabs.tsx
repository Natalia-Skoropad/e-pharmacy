'use client';

import { useState } from 'react';

import {
  CircleMinus,
  CirclePlus,
  History,
  ShoppingCart,
  Trash2,
} from 'lucide-react';

import { ORDER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { CountLabel } from '@e-pharmacy/ui/data-display';
import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';
import { OrderRejectionSourceBadge } from '@e-pharmacy/ui/statistics';
import { LazyLoadButton } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { formatDateTime } from '@e-pharmacy/utils/date';
import { formatMoney } from '@e-pharmacy/utils/money';

import {
  getPharmacyOrderComments,
  createPharmacyOrderComment,
  deletePharmacyOrderComment,
} from '@/lib/api/browser';

import type {
  PharmacyOrderDetails,
  PharmacyOrderActivityHistoryItem,
} from '@/lib/orders/orders';

import { EntityComments } from '@/components/comments/EntityComments';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

const COMMENTS_PER_PAGE = 10;
const HISTORY_INITIAL_VISIBLE_COUNT = 10;
const HISTORY_LOAD_STEP = 5;

//===================================================================

export type OrderHistoryEntry =
  | Readonly<{
      id: string;
      occurredAt: string;
      kind: 'status';
      entry: PharmacyOrderDetails['statusHistory'][number];
    }>
  | Readonly<{
      id: string;
      occurredAt: string;
      kind: 'activity';
      entry: PharmacyOrderActivityHistoryItem;
    }>;

//===================================================================

export function ManagerCommentTab({
  orderId,
  totalComments,
  isEditable,
  onTotalChange,
}: Readonly<{
  orderId: string;
  totalComments: number;
  isEditable: boolean;
  onTotalChange: (total: number) => void;
}>) {
  return (
    <EntityComments
      showCountWhileLoading
      entityKey={`order:${orderId}`}
      initialTotal={totalComments}
      presentation="profile"
      title="Order comments"
      description="Private comments about this order, visible to authorized pharmacy staff."
      emptyTitle="No internal comments yet"
      emptyText="Internal order comments will appear here."
      isEditable={isEditable}
      placeholder="Write an internal comment for this order..."
      load={(page, options) =>
        getPharmacyOrderComments(
          orderId,
          { page, perPage: COMMENTS_PER_PAGE },
          options
        )
      }
      create={async (text, options) => {
        await createPharmacyOrderComment(
          orderId,
          text,
          options.clientRequestId,
          options
        );
      }}
      remove={(id, options) => deletePharmacyOrderComment(orderId, id, options)}
      onTotalChange={onTotalChange}
    />
  );
}

//===================================================================

function getOrderActivityLabel(
  activity: PharmacyOrderActivityHistoryItem
): string {
  if (activity.type === 'product_added') return 'Product added';
  if (activity.type === 'product_removed') return 'Product removed';
  if (activity.type === 'quantity_increased') return 'Quantity increased';

  return 'Quantity decreased';
}

//===================================================================

export function HistoryTab({
  historyEntries,
  rejectionReason,
  rejectedByType,
}: Readonly<{
  historyEntries: OrderHistoryEntry[];
  rejectionReason?: string;
  rejectedByType?: 'manager' | 'client';
}>) {
  const [visibleCount, setVisibleCount] = useState(
    HISTORY_INITIAL_VISIBLE_COUNT
  );

  const visibleEntries = historyEntries.slice(0, visibleCount);

  return (
    <section className={css.methodCard} aria-labelledby="history-title">
      <ProfileSectionHeader
        title="Order history"
        titleId="history-title"
        icon={<History size={22} aria-hidden="true" />}
        description="Review status updates and product changes for this order."
        action={
          <CountLabel
            className={css.tabCountLabel}
            shown={visibleEntries.length}
            total={historyEntries.length}
            label="history events"
          />
        }
      />

      <ol className={css.historyList}>
        {visibleEntries.map((historyEntry) => {
          if (historyEntry.kind === 'status') {
            const entry = historyEntry.entry;

            const toneClassName =
              entry.status === 'rejected'
                ? css.historyDanger
                : entry.status === 'in_progress'
                  ? css.historyWarning
                  : entry.status === 'new'
                    ? css.historyInfo
                    : undefined;

            return (
              <li key={historyEntry.id} className={toneClassName}>
                <History size={18} aria-hidden="true" />
                <div className={css.historyContent}>
                  <div className={css.historyTopRow}>
                    <div className={css.historyMeta}>
                      <strong>
                        {ORDER_STATUS_PRESENTATION[entry.status].label}
                      </strong>
                      <time dateTime={entry.changedAt}>
                        {formatDateTime(entry.changedAt) ?? '—'}
                      </time>
                    </div>

                    <span className={css.historyStatusBadges}>
                      <StatusBadge
                        {...ORDER_STATUS_PRESENTATION[entry.status]}
                      />
                      <OrderRejectionSourceBadge
                        status={entry.status}
                        rejectedByType={rejectedByType}
                      />
                    </span>
                  </div>

                  {entry.comment ? <p>{entry.comment}</p> : null}
                  {entry.status === 'rejected' && rejectionReason ? (
                    <p className={css.historyRejectionReason}>
                      <b>Rejection reason:</b> {rejectionReason}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          }

          const activity = historyEntry.entry;
          const isIncrease = activity.quantityDelta > 0;

          const priceChanged =
            activity.previousUnitPrice !== activity.unitPrice;

          const ActivityIcon =
            activity.type === 'product_added'
              ? ShoppingCart
              : activity.type === 'product_removed'
                ? Trash2
                : isIncrease
                  ? CirclePlus
                  : CircleMinus;

          const activityToneClassName =
            activity.type === 'product_removed' ||
            activity.type === 'quantity_decreased'
              ? css.historyDanger
              : undefined;

          return (
            <li key={historyEntry.id} className={activityToneClassName}>
              <ActivityIcon size={18} aria-hidden="true" />
              <div className={css.historyContent}>
                <div className={css.historyTopRow}>
                  <div className={css.historyMeta}>
                    <strong>{getOrderActivityLabel(activity)}</strong>
                    <time dateTime={activity.occurredAt}>
                      {formatDateTime(activity.occurredAt) ?? '—'}
                    </time>
                  </div>
                </div>
                <p>
                  <b>{activity.productName}</b>: {activity.previousQuantity} →{' '}
                  {activity.quantity}{' '}
                  <span
                    className={
                      isIncrease ? css.historyIncrease : css.historyDecrease
                    }
                  >
                    ({activity.quantityDelta > 0 ? '+' : ''}
                    {activity.quantityDelta})
                  </span>
                </p>
                {priceChanged ? (
                  <p className={css.historyPriceChange}>
                    Unit price changed from{' '}
                    {formatMoney(activity.previousUnitPrice) ?? '—'} to{' '}
                    {formatMoney(activity.unitPrice) ?? '—'}.
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <LazyLoadButton
        visibleCount={visibleEntries.length}
        totalCount={historyEntries.length}
        label="Show more history"
        onLoadMore={() =>
          setVisibleCount((current) => current + HISTORY_LOAD_STEP)
        }
      />
    </section>
  );
}
