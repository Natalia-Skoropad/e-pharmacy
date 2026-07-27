export type StatusPresentationTone =
  | 'info'
  | 'pending'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

//===================================================================

export type StatusPresentation = Readonly<{
  label: string;
  tone: StatusPresentationTone;
}>;
