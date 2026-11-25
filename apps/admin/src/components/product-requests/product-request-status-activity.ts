import type {
  AdminRequestDetail,
  RequestHistoryEntry,
} from '@/lib/product-requests/admin-product-request-detail';

//===================================================================

// The API returns history in append order. The review substate is recorded
// by the correction/resubmission event titles, not as a separate field.
export function getLatestProductRequestStatusActivity(
  history: readonly RequestHistoryEntry[]
) {
  type Entry = RequestHistoryEntry;

  let previous: Entry | undefined;
  let needsChanges = false;

  let latest:
    | {
        entry: Entry;
        previous?: Entry;
        previousNeedsChanges: boolean;
        needsChanges: boolean;
        created: boolean;
        actorRole: string | null;
      }
    | undefined;

  for (const entry of history) {
    const title = entry.title.trim().toLowerCase();
    const created = title === 'request created' || title === 'draft created';

    const submitted =
      title === 'sent for moderation' || title === 'resent for moderation';

    const corrections =
      entry.status === 'on_moderation' && title === 'changes requested';

    const ownerCancelled = title === 'cancelled by owner';

    const adminDecision =
      corrections ||
      title === 'request approved' ||
      title === 'request rejected';

    const previousNeedsChanges = needsChanges;

    if (entry.status !== 'on_moderation' || submitted) {
      needsChanges = false;
    } else if (corrections) {
      needsChanges = true;
    }

    if (
      created ||
      submitted ||
      adminDecision ||
      ownerCancelled ||
      (previous && previous.status !== entry.status)
    ) {
      latest = {
        entry,
        previous,
        previousNeedsChanges,
        needsChanges,
        created,

        actorRole: entry.isInferred
          ? null
          : created || submitted || ownerCancelled
            ? 'Pharmacy owner'
            : adminDecision
              ? 'Admin'
              : null,
      };
    }
    previous = entry;
  }

  return latest ?? null;
}

//===================================================================

// The saved request carries the cancellation source for its terminal status.
export function getProductRequestCancellationLabel(
  request: Pick<AdminRequestDetail, 'status' | 'cancelledBy'>
): string | null {
  if (request.status !== 'rejected') return null;
  if (request.cancelledBy === 'admin') return 'Cancelled by Admin';
  if (request.cancelledBy === 'owner') return 'Cancelled by owner';

  return null;
}
