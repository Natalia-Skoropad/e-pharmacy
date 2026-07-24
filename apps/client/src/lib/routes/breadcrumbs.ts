import type { BreadcrumbItem } from '@e-pharmacy/config/navigation';

import { ROUTES } from './routes';

//===================================================================\

export function createBreadcrumbs(currentPageLabel: string): BreadcrumbItem[] {
  return [{ label: 'Home', href: ROUTES.HOME }, { label: currentPageLabel }];
}
