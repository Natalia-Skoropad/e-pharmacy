import { buildSlugId } from '@e-pharmacy/utils';

//===================================================================

export function buildProductPath(name: string, id: string): string {
  return `/${buildSlugId(name, id)}`;
}
