import { ROUTES } from '@/lib/constants/routes';

import type { BreadcrumbItem } from '@/types/breadcrumbs';

export function createBreadcrumbs(currentPageLabel: string): BreadcrumbItem[] {
  return [{ label: 'Home', href: ROUTES.HOME }, { label: currentPageLabel }];
}
