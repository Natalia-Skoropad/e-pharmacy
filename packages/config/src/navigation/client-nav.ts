import { ROUTES } from '../routes/client-routes';

//===================================================================

export const CLIENT_NAV_LINKS = [
  {
    label: 'Home',
    href: ROUTES.HOME,
  },
  {
    label: 'Pharmacy stores',
    href: ROUTES.STORES,
  },
  {
    label: 'Medicines catalog',
    href: ROUTES.MEDICINES_CATALOG,
  },
] as const;

//===================================================================

export const INFO_NAV_LINKS = [
  {
    label: 'Personal data notice',
    href: ROUTES.PERSONAL_DATA_NOTICE,
  },
  {
    label: 'User agreement',
    href: ROUTES.USER_AGREEMENT,
  },
  {
    label: 'Delivery and payment',
    href: ROUTES.DELIVERY_PAYMENT,
  },
  {
    label: 'Return policy',
    href: ROUTES.RETURN_POLICY,
  },
] as const;

//===================================================================

export const CLIENT_FOOTER_LINKS = INFO_NAV_LINKS;
