import { buildSlugId } from '@e-pharmacy/utils';

import { ROUTES } from '@/lib/constants/routes';

//===================================================================

export function buildStorePath(name: string, id: string): string {
  return `${ROUTES.PHARMACY_DETAILS}/${buildSlugId(name, id)}`;
}
