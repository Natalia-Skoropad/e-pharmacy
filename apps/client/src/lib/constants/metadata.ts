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
  'Track pharmacy orders without digging through emails like a detective with a tiny magnifying glass.',
  'Keep your profile, delivery address, and contact details ready for faster checkout.',
  'Return to favorites, cart items, and personal pharmacy history in a few clicks.',
] as const;

export const PASSWORD_RECOVERY_TITLE = 'Recover password';
export const PASSWORD_RECOVERY_DESCRIPTION =
  'Enter the email linked to your E-PHARMACY account. If we find it, we will send safe recovery instructions without showing account details on the page.';

export const PASSWORD_RECOVERY_BENEFITS = [
  'Use the email from your account, and we will handle the rest quietly and securely.',
  'For privacy, the page shows the same result even if an email is not registered.',
  'After recovery, come back and continue managing orders, favorites, and checkout details.',
] as const;

//===================================================================

export const REGISTER_TITLE = 'Register';
export const REGISTER_DESCRIPTION =
  'Create your E-PHARMACY account to save checkout details, manage pharmacy orders, and keep favorite medicines close at hand.';

export const REGISTER_BENEFITS = [
  'Save your profile once and use it again at checkout instead of typing the same details forever.',
  'Collect favorite medicines and pharmacies in one calm place — no browser-tab jungle required.',
  'View order history and quickly return to the pharmacies and products you need.',
] as const;

//===================================================================

export const PROFILE_TITLE = 'Profile';
export const PROFILE_DESCRIPTION =
  'Manage your E-PHARMACY customer profile and account details.';

//===================================================================

export const NOT_FOUND_TITLE = 'Page Not Found';
export const NOT_FOUND_DESCRIPTION =
  'The requested E-PHARMACY page could not be found.';
