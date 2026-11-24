import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import type { ProductRequestDetailsViewModel } from '@/lib/product-requests/product-requests';

import {
  getLatestProductRequestStatusActivity,
  getProductRequestCancellationLabel,
} from './product-request-status-activity';

import css from './ProductRequestOverview.module.css';

//===================================================================

export function ProductRequestStatusActivity({
  request,
}: Readonly<{
  request: Pick<
    ProductRequestDetailsViewModel,
    'status' | 'cancelledBy' | 'history'
  >;
}>) {
  const activity = getLatestProductRequestStatusActivity(request.history);

  const cancellationLabel =
    activity?.entry.status === 'rejected'
      ? getProductRequestCancellationLabel(request)
      : null;

  return (
    <section
      className={css.activityCard}
      aria-label="Product request status activity"
    >
      <h3 className={css.activityHeading}>Product request status activity</h3>
      {activity ? (
        <ol className={css.activityList}>
          <li className={css.activityItem}>
            <div className={css.activityTitle}>
              {activity.created
                ? 'Product request created'
                : 'Product request status changed'}
            </div>
            <div className={css.activityTransition}>
              {!activity.entry.isInferred && activity.created ? (
                <>
                  <span>Created</span>
                  <span aria-hidden="true">→</span>
                </>
              ) : !activity.entry.isInferred &&
                activity.previous &&
                !activity.previous.isInferred ? (
                <>
                  <StatusBadge
                    {...PRODUCT_REQUEST_STATUS_PRESENTATION[
                      activity.previous.status
                    ]}
                  />
                  {activity.previousNeedsChanges ? (
                    <StatusBadge label="Needs changes" tone="neutral" />
                  ) : null}
                  <span aria-hidden="true">→</span>
                </>
              ) : null}
              <StatusBadge
                {...PRODUCT_REQUEST_STATUS_PRESENTATION[activity.entry.status]}
              />
              {activity.needsChanges ? (
                <StatusBadge label="Needs changes" tone="neutral" />
              ) : null}
              {cancellationLabel ? (
                <StatusBadge
                  label={cancellationLabel}
                  tone="neutral"
                  className={css.activityCancellationBadge}
                />
              ) : null}
            </div>
            <div className={css.activityMeta}>
              {activity.entry.isInferred ? (
                <span>
                  Legacy history · exact transition and event time unavailable
                </span>
              ) : (
                <>
                  <span>
                    {activity.actorRole
                      ? `${activity.actorRole} (name not recorded)`
                      : 'Actor not recorded'}
                  </span>
                  <time dateTime={activity.entry.createdAt}>
                    {new Date(activity.entry.createdAt).toLocaleString('en-GB')}
                  </time>
                </>
              )}
            </div>
            <p className={css.activityReason}>{activity.entry.description}</p>
          </li>
        </ol>
      ) : (
        <p className={css.activityEmpty}>
          No product request status changes to display yet.
        </p>
      )}
    </section>
  );
}
