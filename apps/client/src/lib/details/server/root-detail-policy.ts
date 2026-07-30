import type { RootDetail } from './root-detail-resolver';

//===================================================================

export type RootDetailSelection =
  | { status: 'found'; detail: RootDetail }
  | { status: 'collision' }
  | { status: 'empty' };

//===================================================================

export function selectRootDetail(
  details: readonly RootDetail[]
): RootDetailSelection {
  if (details.length === 0) return { status: 'empty' };
  if (details.length > 1) return { status: 'collision' };
  return { status: 'found', detail: details[0] };
}
