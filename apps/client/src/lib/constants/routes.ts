import { ROUTE_SEGMENTS } from '@e-pharmacy/config';

//===================================================================

export const ROUTES = {
  HOME: '/',
  STORES: `/${ROUTE_SEGMENTS.stores}`,
  PHARMACY_DETAILS: `/${ROUTE_SEGMENTS.pharmacyDetails}`,
  MEDICINE_STORE: `/${ROUTE_SEGMENTS.medicineStore}`,
  MEDICINES_CATALOG: `/${ROUTE_SEGMENTS.medicinesCatalog}`,
  PRODUCT_DETAILS: `/${ROUTE_SEGMENTS.productDetails}`,
  CART: `/${ROUTE_SEGMENTS.cart}`,
  CHECKOUT: `/${ROUTE_SEGMENTS.checkout}`,
  LOGIN: `/${ROUTE_SEGMENTS.login}`,
  REGISTER: `/${ROUTE_SEGMENTS.register}`,
  PASSWORD_RECOVERY: `/${ROUTE_SEGMENTS.passwordRecovery}`,
  RESET_PASSWORD: '/reset-password',
  PROFILE: `/${ROUTE_SEGMENTS.profile}`,
  DELIVERY_PAYMENT: '/delivery-and-payment',
  RETURN_POLICY: '/return-policy',
  USER_AGREEMENT: '/user-agreement',
  PERSONAL_DATA_NOTICE: '/personal-data-notice',
} as const;
