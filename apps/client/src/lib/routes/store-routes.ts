import { buildSlugId } from '@e-pharmacy/utils';

//===================================================================

export function buildStorePath(name: string, id: string): string {
  return `/${buildSlugId(name, id)}`;
}
