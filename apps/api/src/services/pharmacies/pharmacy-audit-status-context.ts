/** Resolve status badges for lifecycle audit events without changing stored logs. */
export function resolvePharmacyAuditStatusContext(input: {
  action: string;
  before?: Readonly<Record<string, unknown>> | null;
  after?: Readonly<Record<string, unknown>> | null;
}): { previousStatus: string | null; nextStatus: string | null } {
  const { action, before, after } = input;
  const previous = typeof before?.status === 'string' ? before.status : null;
  const next = typeof after?.status === 'string' ? after.status : null;

  const isCorrections = action === 'pharmacy.corrections.requested';

  const isLegacyResubmission =
    action === 'pharmacy.moderation.submitted' &&
    before?.reviewState === 'changes_requested' &&
    after?.reviewState === 'pending';

  // Only infer an unchanged status for review-only events. A status change
  // with one missing side must not be misrepresented as an unchanged status.
  if (isCorrections || isLegacyResubmission) {
    const unchangedStatus = previous ?? next ?? 'on_verification';

    return {
      previousStatus: previous ?? unchangedStatus,
      nextStatus: next ?? unchangedStatus,
    };
  }

  return { previousStatus: previous, nextStatus: next };
}
