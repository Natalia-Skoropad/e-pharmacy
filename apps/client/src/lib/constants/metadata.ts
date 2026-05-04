import { APP_NAMES } from '@e-pharmacy/config';

import { ASSETS } from './assets';

export const SITE_NAME = APP_NAMES.client;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const HOME_TITLE = 'Online Pharmacy Store';
export const HOME_DESCRIPTION =
  'Order medicines online, explore trusted pharmacy stores, and manage your health essentials with E-PHARMACY.';

export const DEFAULT_OG_IMAGE = ASSETS.defaultOgImage;
export const DEFAULT_OG_IMAGE_ALT =
  'E-PHARMACY online pharmacy storefront preview';
