export const USER_NAME_PATTERN = /^[A-Za-z]+(?:[ '’\-][A-Za-z]+)*$/;

export const PHARMACY_NAME_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9 '’&().,\-]*$/;

export const BANK_RECIPIENT_NAME_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9 '’&().,\-]*$/;

export const BANK_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 '’&().,\-]*$/;

export const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export const PHONE_PATTERN = /^\+380\d{9}$/;
export const PASSWORD_PATTERN = /^\S+$/;
export const ADDRESS_PATTERN = /^[A-Za-z0-9 .,'’/#&()\-]+$/;
export const SEARCH_TEXT_PATTERN = /^[A-Za-z0-9 .,'’/#&()\-]*$/;

export const REVIEW_COMMENT_PATTERN =
  /^[A-Za-z0-9\s.,!?;:'"“”()\-–—/#%+*]+$/;

export const ORDER_COMMENT_PATTERN =
  /^[A-Za-z0-9\s.,!?;:'"“”()\-–—/#%+*]*$/;

export const PAYMENT_PURPOSE_PATTERN =
  /^[A-Za-z0-9\s.,!?;:'"“”()\-–—/#%+*]+$/;

export const PICTURE_DATA_URL_PATTERN =
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export const TAX_ID_PATTERN = /^\d{8,10}$/;
export const IBAN_PATTERN = /^UA\d{27}$/;

export const WORKING_HOURS_PATTERN =
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(?:Closed|(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d)(?:;\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(?:Closed|(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d))*$/;

export const TEXT_EDITOR_PATTERN =
  /^[A-Za-z0-9\s.,!?;:'"“”()\-–—/#%+*\n\r]+$/;
