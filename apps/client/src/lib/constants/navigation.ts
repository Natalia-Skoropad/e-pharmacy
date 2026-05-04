import { ROUTES } from './routes';

//===================================================================

export const CLIENT_NAV_LINKS = [
  {
    label: 'Home',
    href: ROUTES.HOME,
  },
  {
    label: 'Stores',
    href: ROUTES.STORES,
  },
  {
    label: 'Medicine store',
    href: ROUTES.MEDICINE_STORE,
  },
] as const;

//===================================================================

export const CLIENT_FOOTER_LINKS = [
  {
    label: 'Cart',
    href: ROUTES.CART,
  },
  {
    label: 'Checkout',
    href: ROUTES.CHECKOUT,
  },
  {
    label: 'Profile',
    href: ROUTES.PROFILE,
  },
] as const;
