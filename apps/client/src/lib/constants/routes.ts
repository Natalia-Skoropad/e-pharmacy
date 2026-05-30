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
  RESET_PASSWORD: `/${ROUTE_SEGMENTS.resetPassword}`,
  PROFILE: `/${ROUTE_SEGMENTS.profile}`,
  DELIVERY_PAYMENT: `/${ROUTE_SEGMENTS.deliveryPayment}`,
  RETURN_POLICY: `/${ROUTE_SEGMENTS.returnPolicy}`,
  USER_AGREEMENT: `/${ROUTE_SEGMENTS.userAgreement}`,
  PERSONAL_DATA_NOTICE: `/${ROUTE_SEGMENTS.personalDataNotice}`,
  VENDOR: `/${ROUTE_SEGMENTS.vendor}`,
  ADMIN: `/${ROUTE_SEGMENTS.admin}`,
} as const;
