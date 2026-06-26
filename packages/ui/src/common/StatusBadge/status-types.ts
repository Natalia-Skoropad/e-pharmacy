export type PharmacyStatusTone = 'blue' | 'yellow' | 'green' | 'red' | 'gray';

//===================================================================

export type PharmacyStatusVariant =
  | 'new'
  | 'in_work'
  | 'in_progress'
  | 'on_moderation'
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

export function formatStatusLabel(status: PharmacyStatusVariant) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
