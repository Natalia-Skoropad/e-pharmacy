export type StatusTone =
  | 'blue'
  | 'yellow'
  | 'green'
  | 'red'
  | 'gray'
  | 'beauty';

//===================================================================

export type StatusPresentation = Readonly<{
  label: string;
  tone: StatusTone;
}>;

//===================================================================

const STATUS_PRESENTATION: Readonly<Record<string, StatusPresentation>> = {
  new: { label: 'New', tone: 'blue' },
  in_work: { label: 'In work', tone: 'yellow' },
  in_progress: { label: 'In progress', tone: 'yellow' },
  on_moderation: { label: 'On moderation', tone: 'yellow' },
  on_verification: { label: 'On verification', tone: 'beauty' },
  active: { label: 'Active', tone: 'green' },
  successful: { label: 'Successful', tone: 'green' },
  approved: { label: 'Approved', tone: 'green' },
  blocked: { label: 'Blocked', tone: 'red' },
  rejected: { label: 'Rejected', tone: 'red' },
  draft: { label: 'Draft', tone: 'gray' },
  empty: { label: 'Empty', tone: 'gray' },
};

//===================================================================

export function getStatusPresentation(
  status: string,
  fallbackLabel?: string
): StatusPresentation {
  return (
    STATUS_PRESENTATION[status] ?? {
      label: fallbackLabel ?? status,
      tone: 'gray',
    }
  );
}
