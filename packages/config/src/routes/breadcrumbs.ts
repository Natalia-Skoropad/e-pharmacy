import { ROUTES } from './client-routes';

//===================================================================

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

//===================================================================

export function createBreadcrumbs(currentPageLabel: string): BreadcrumbItem[] {
  return [{ label: 'Home', href: ROUTES.HOME }, { label: currentPageLabel }];
}
