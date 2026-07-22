export type PharmacyStatusTone =
  | 'blue'
  | 'yellow'
  | 'green'
  | 'red'
  | 'gray'
  | 'beauty';

//===================================================================

export type PharmacyStatusVariant =
  | 'new'
  | 'in_work'
  | 'in_progress'
  | 'on_moderation'
  | 'on_verification'
  | 'active'
  | 'successful'
  | 'approved'
  | 'blocked'
  | 'rejected'
  | 'draft'
  | 'empty';

//===================================================================

export function getStatusTone(
  status: PharmacyStatusVariant
): PharmacyStatusTone {
  if (status === 'new') return 'blue';
  if (status === 'on_verification') return 'beauty';
  if (
    status === 'in_work' ||
    status === 'in_progress' ||
    status === 'on_moderation'
  ) {
    return 'yellow';
  }
  if (status === 'active' || status === 'successful' || status === 'approved') {
    return 'green';
  }
  if (status === 'blocked' || status === 'rejected') return 'red';
  return 'gray';
}

//===================================================================

const STATUS_LABELS: Record<PharmacyStatusVariant, string> = {
  new: 'New',
  in_work: 'In work',
  in_progress: 'In progress',
  on_moderation: 'On moderation',
  on_verification: 'On verification',
  active: 'Active',
  successful: 'Successful',
  approved: 'Approved',
  blocked: 'Blocked',
  rejected: 'Rejected',
  draft: 'Draft',
  empty: 'Empty',
};

//===================================================================

export function formatStatusLabel(status: PharmacyStatusVariant): string {
  return STATUS_LABELS[status];
}
