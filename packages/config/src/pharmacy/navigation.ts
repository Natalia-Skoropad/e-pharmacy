import { PHARMACY_ROUTES } from './routes';

//===================================================================

export const PHARMACY_NAV_LINKS = [
  { label: 'Dashboard', href: PHARMACY_ROUTES.DASHBOARD },
  { label: 'Orders', href: PHARMACY_ROUTES.ORDERS },
  { label: 'Clients', href: PHARMACY_ROUTES.CLIENTS },
  { label: 'Own products', href: PHARMACY_ROUTES.PRODUCTS },
  { label: 'All products', href: PHARMACY_ROUTES.ALL_PRODUCTS },
  { label: 'Product requests', href: PHARMACY_ROUTES.PRODUCT_REQUESTS },
  { label: 'Pharmacy profile', href: PHARMACY_ROUTES.PROFILE },
] as const;
