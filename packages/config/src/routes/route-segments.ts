export const ROUTE_SEGMENTS = {
  pharmacies: 'pharmacies',
  pharmacyDetails: 'pharmacies',
  medicinePharmacy: 'medicine-pharmacy',
  productCatalog: 'product-catalog',
  productDetails: 'products',
  cart: 'cart',
  checkout: 'checkout',
  login: 'login',
  register: 'register',
  passwordRecovery: 'password-recovery',
  resetPassword: 'reset-password',
  profile: 'profile',
  deliveryPayment: 'delivery-and-payment',
  returnPolicy: 'return-policy',
  userAgreement: 'user-agreement',
  personalDataNotice: 'personal-data-notice',
  pharmacy: 'pharmacy',
  admin: 'admin',
} as const;

//===================================================================

/**
 * Root-level product/pharmacy SEO URLs live at `/:slugId`.
 * Every real static top-level route must stay here so dynamic details
 * never accidentally capture `/pharmacy`, `/admin`, legal pages, etc.
 */
export const RESERVED_ROOT_SLUGS = [
  ROUTE_SEGMENTS.cart,
  ROUTE_SEGMENTS.checkout,
  ROUTE_SEGMENTS.profile,
  ROUTE_SEGMENTS.login,
  ROUTE_SEGMENTS.register,
  ROUTE_SEGMENTS.pharmacies,
  ROUTE_SEGMENTS.medicinePharmacy,
  ROUTE_SEGMENTS.productCatalog,
  ROUTE_SEGMENTS.deliveryPayment,
  ROUTE_SEGMENTS.returnPolicy,
  ROUTE_SEGMENTS.userAgreement,
  ROUTE_SEGMENTS.personalDataNotice,
  ROUTE_SEGMENTS.passwordRecovery,
  ROUTE_SEGMENTS.resetPassword,
  ROUTE_SEGMENTS.pharmacy,
  ROUTE_SEGMENTS.admin,
] as const;

//===================================================================

const RESERVED_ROOT_SLUG_SET = new Set<string>(RESERVED_ROOT_SLUGS);

export function isReservedRootSlug(value: string): boolean {
  return RESERVED_ROOT_SLUG_SET.has(value.trim().toLowerCase());
}
