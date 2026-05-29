import { APP_NAMES } from '@e-pharmacy/config';

import { ASSETS } from './assets';
import { CLIENT_ENV } from './env';

//===================================================================

export const SITE_NAME = APP_NAMES.client;
export const SITE_URL = CLIENT_ENV.siteUrl;

//===================================================================

export const HOME_TITLE = 'Online Pharmacy Store';
export const HOME_DESCRIPTION =
  'Order medicines online, explore trusted pharmacy stores, and manage your health essentials with E-PHARMACY.';

//===================================================================

export const DEFAULT_OG_IMAGE = ASSETS.defaultOgImage;
export const DEFAULT_OG_IMAGE_ALT =
  'E-PHARMACY online pharmacy storefront preview';

//===================================================================

export const STORES_TITLE = 'Pharmacy Stores';
export const STORES_DESCRIPTION =
  'Explore available pharmacy stores and choose a trusted place to order medicines online.';

//===================================================================

export const MEDICINE_STORE_TITLE = 'Medicine Store';
export const MEDICINE_STORE_DESCRIPTION =
  'Browse medicines, compare available products, and prepare your online pharmacy order.';

//===================================================================

export const MEDICINES_CATALOG_TITLE = 'Medicines Catalog';
export const MEDICINES_CATALOG_DESCRIPTION =
  'Search medicines by name or article, filter products by category and pharmacy availability, and compare trusted online pharmacy offers.';

//===================================================================

export const CART_TITLE = 'Cart';
export const CART_DESCRIPTION =
  'Review selected medicines and prepare your order in the E-PHARMACY cart.';

//===================================================================

export const CHECKOUT_TITLE = 'Checkout';
export const CHECKOUT_DESCRIPTION =
  'Complete your E-PHARMACY order with customer and delivery details.';

//===================================================================

export const LOGIN_TITLE = 'Log In';
export const LOGIN_DESCRIPTION =
  'Access your E-PHARMACY account to track orders, manage saved medicines, and keep your delivery details ready for the next checkout.';

export const LOGIN_BENEFITS = [
  'Track your orders, profile details, delivery information, and saved account data in one secure place.',
  'Return to your cart, favorite medicines, and trusted pharmacies faster after signing in.',
] as const;

//===================================================================

export const PASSWORD_RECOVERY_TITLE = 'Recover password';
export const PASSWORD_RECOVERY_DESCRIPTION =
  'Restore access to your E-PHARMACY account by entering your account email and creating a new password.';

export const PASSWORD_RECOVERY_BENEFITS = [
  'Use the email linked to your account and set a new password that meets the security requirements.',
] as const;

//===================================================================

export const RESET_PASSWORD_TITLE = 'Reset password';

export const RESET_PASSWORD_BENEFITS = [
  'Create a new secure password from the email reset link.',
  'After changing the password, sign in again with your updated credentials.',
] as const;

//===================================================================

export const REGISTER_TITLE = 'Register';
export const REGISTER_DESCRIPTION =
  'Create your E-PHARMACY account to save checkout details, manage pharmacy orders, and keep favorite medicines close at hand.';

export const REGISTER_BENEFITS = [
  'Save your profile details once and use them again during checkout.',
  'Keep favorite medicines and pharmacies organized in your personal account.',
  'View your order history and quickly return to the products and pharmacies you use most.',
] as const;

//===================================================================

export const PROFILE_TITLE = 'Profile';
export const PROFILE_DESCRIPTION =
  'Manage your E-PHARMACY customer profile and account details.';

export const ORDER_DETAILS_TITLE = 'Order details';
export const ORDER_DETAILS_DESCRIPTION =
  'View a private E-PHARMACY customer order in your profile.';

//===================================================================

export const NOT_FOUND_TITLE = 'Page Not Found';
export const NOT_FOUND_DESCRIPTION =
  'The requested E-PHARMACY page could not be found.';
