import { PHARMACY_ROUTES } from '../routes/pharmacy-routes';

//===================================================================

export const PHARMACY_NAV_LINKS = [
  { label: 'Dashboard', href: PHARMACY_ROUTES.DASHBOARD },
  { label: 'Orders', href: PHARMACY_ROUTES.ORDERS },
  { label: 'Clients', href: PHARMACY_ROUTES.CLIENTS },
  { label: 'Medicines', href: PHARMACY_ROUTES.MEDICINES },
  { label: 'Medicine requests', href: PHARMACY_ROUTES.MEDICINE_REQUESTS },
  { label: 'Profile', href: PHARMACY_ROUTES.PROFILE },
] as const;
