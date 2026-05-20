export const APP_NAMES = {
  client: 'E-PHARMACY',
  vendor: 'E-PHARMACY Vendor',
  admin: 'E-PHARMACY Admin',
} as const;

//===================================================================

export const ROUTE_SEGMENTS = {
  stores: 'pharmacy-stores',
  pharmacyDetails: 'pharmacies',
  medicineStore: 'medicine-store',
  medicinesCatalog: 'medicines-catalog',
  productDetails: 'products',
  cart: 'cart',
  checkout: 'checkout',
  login: 'login',
  register: 'register',
  passwordRecovery: 'password-recovery',
  profile: 'profile',
} as const;
