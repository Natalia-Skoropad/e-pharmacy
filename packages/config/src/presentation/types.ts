export type StatusPresentationTone =
  | 'info'
  | 'pending'
  | 'mustard'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

//===================================================================

export type StatusPresentation = Readonly<{
  label: string;
  tone: StatusPresentationTone;
}>;
