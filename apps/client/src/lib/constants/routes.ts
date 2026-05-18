import { ROUTE_SEGMENTS } from '@e-pharmacy/config';

//===================================================================

export const ROUTES = {
  HOME: '/',
  STORES: `/${ROUTE_SEGMENTS.stores}`,
  MEDICINE_STORE: `/${ROUTE_SEGMENTS.medicineStore}`,
  MEDICINES_CATALOG: `/${ROUTE_SEGMENTS.medicinesCatalog}`,
  CART: `/${ROUTE_SEGMENTS.cart}`,
  CHECKOUT: `/${ROUTE_SEGMENTS.checkout}`,
  LOGIN: `/${ROUTE_SEGMENTS.login}`,
  REGISTER: `/${ROUTE_SEGMENTS.register}`,
  PASSWORD_RECOVERY: `/${ROUTE_SEGMENTS.passwordRecovery}`,
  PROFILE: `/${ROUTE_SEGMENTS.profile}`,
} as const;
