import { ADMIN_ROUTES } from './routes';

//===================================================================

export const ADMIN_NAV_LINKS = [
  { label: 'Dashboard', href: ADMIN_ROUTES.DASHBOARD },
  { label: 'Orders', href: ADMIN_ROUTES.ORDERS },
  { label: 'Products', href: ADMIN_ROUTES.PRODUCTS },
  { label: 'Clients', href: ADMIN_ROUTES.CLIENTS },
  { label: 'Suppliers', href: ADMIN_ROUTES.SUPPLIERS },
] as const;
