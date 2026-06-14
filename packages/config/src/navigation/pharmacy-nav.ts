import { PHARMACY_ROUTES } from '../routes/pharmacy-routes';

//===================================================================

export const PHARMACY_NAV_LINKS = [
  { label: 'Dashboard', href: PHARMACY_ROUTES.DASHBOARD },
  { label: 'Orders', href: PHARMACY_ROUTES.ORDERS },
  { label: 'Clients', href: PHARMACY_ROUTES.CLIENTS },
  { label: 'Products', href: PHARMACY_ROUTES.PRODUCTS },
  { label: 'Product requests', href: PHARMACY_ROUTES.PRODUCT_REQUESTS },
  { label: 'Profile', href: PHARMACY_ROUTES.PROFILE },
] as const;
