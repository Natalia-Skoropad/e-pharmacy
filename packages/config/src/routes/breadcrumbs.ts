import type { BreadcrumbItem } from '@e-pharmacy/types/navigation';

import { ROUTES } from './client-routes';

//===================================================================

export function createBreadcrumbs(currentPageLabel: string): BreadcrumbItem[] {
  return [{ label: 'Home', href: ROUTES.HOME }, { label: currentPageLabel }];
}
