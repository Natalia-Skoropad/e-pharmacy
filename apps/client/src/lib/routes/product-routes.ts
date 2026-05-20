import { buildSlugId } from '@e-pharmacy/utils';

import { ROUTES } from '@/lib/constants/routes';

//===================================================================

export function buildProductPath(name: string, id: string): string {
  return `${ROUTES.PRODUCT_DETAILS}/${buildSlugId(name, id)}`;
}
