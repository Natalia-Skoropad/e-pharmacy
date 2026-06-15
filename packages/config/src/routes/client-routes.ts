import { ROUTE_SEGMENTS } from './route-segments';

//===================================================================

export const ROUTES = {
  HOME: '/',
  PHARMACIES: `/${ROUTE_SEGMENTS.pharmacies}`,
  PHARMACY_DETAILS: `/${ROUTE_SEGMENTS.pharmacyDetails}`,
  MEDICINE_PHARMACY: `/${ROUTE_SEGMENTS.medicinePharmacy}`,
  PRODUCTS_CATALOG: `/${ROUTE_SEGMENTS.productCatalog}`,
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
  PHARMACY: `/${ROUTE_SEGMENTS.pharmacy}`,
  ADMIN: `/${ROUTE_SEGMENTS.admin}`,
} as const;
