import { ADMIN_ROUTES } from '../routes/admin-routes';

//===================================================================

export const ADMIN_NAV_LINKS = [
  { label: 'Dashboard', href: ADMIN_ROUTES.DASHBOARD },
  { label: 'Orders', href: ADMIN_ROUTES.ORDERS },
  { label: 'Products', href: ADMIN_ROUTES.PRODUCTS },
  { label: 'Customers', href: ADMIN_ROUTES.CUSTOMERS },
  { label: 'Suppliers', href: ADMIN_ROUTES.SUPPLIERS },
] as const;
