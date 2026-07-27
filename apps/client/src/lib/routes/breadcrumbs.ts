import { ROUTES } from './routes';

//===================================================================

export type BreadcrumbItem = Readonly<{
  label: string;
  href?: string;
}>;

//===================================================================

export function createBreadcrumbs(currentPageLabel: string): BreadcrumbItem[] {
  return [{ label: 'Home', href: ROUTES.HOME }, { label: currentPageLabel }];
}
