import {
  PHARMACY_ALL_PRODUCTS,
  PHARMACY_CLIENTS,
  PHARMACY_DASHBOARD,
  PHARMACY_ORDERS,
  PHARMACY_PRODUCTS,
  PHARMACY_PRODUCT_REQUESTS,
  PHARMACY_PROFILE,
} from './routes';

//===================================================================

export type PharmacyNavigationItem = Readonly<{
  label: string;
  href: string;
}>;

//===================================================================

export const PHARMACY_NAVIGATION: readonly PharmacyNavigationItem[] = [
  { label: 'Dashboard', href: PHARMACY_DASHBOARD },
  { label: 'Orders', href: PHARMACY_ORDERS },
  { label: 'Clients', href: PHARMACY_CLIENTS },
  { label: 'Own products', href: PHARMACY_PRODUCTS },
  { label: 'All products', href: PHARMACY_ALL_PRODUCTS },
  { label: 'Product requests', href: PHARMACY_PRODUCT_REQUESTS },
  { label: 'Pharmacy profile', href: PHARMACY_PROFILE },
];
