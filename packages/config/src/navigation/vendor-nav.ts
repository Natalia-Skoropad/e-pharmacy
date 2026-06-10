import { VENDOR_ROUTES } from '../routes/vendor-routes';

//===================================================================

export const VENDOR_NAV_LINKS = [
  { label: 'Dashboard', href: VENDOR_ROUTES.DASHBOARD },
  { label: 'Orders', href: VENDOR_ROUTES.ORDERS },
  { label: 'Clients', href: VENDOR_ROUTES.CLIENTS },
  { label: 'Medicines', href: VENDOR_ROUTES.MEDICINES },
  { label: 'Medicine requests', href: VENDOR_ROUTES.MEDICINE_REQUESTS },
  { label: 'Profile', href: VENDOR_ROUTES.PROFILE },
] as const;
