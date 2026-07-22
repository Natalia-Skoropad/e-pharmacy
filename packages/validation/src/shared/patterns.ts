export const USER_NAME_PATTERN = /^\p{L}+(?:[ '’\-]\p{L}+)*$/u;
export const PHARMACY_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '’&().,\-]*$/u;

export const BANK_RECIPIENT_NAME_PATTERN =
  /^[\p{L}\p{N}][\p{L}\p{N} '’&().,\-]*$/u;

export const BANK_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '’&().,\-]*$/u;

export const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export const PHONE_PATTERN = /^\+380\d{9}$/;
export const PASSWORD_PATTERN = /^\S+$/;
export const ADDRESS_PATTERN = /^[\p{L}\p{N} .,'’/#&()\-]+$/u;
export const SEARCH_TEXT_PATTERN = /^[\p{L}\p{N} .,'’/#&()\-]*$/u;

export const REVIEW_COMMENT_PATTERN =
  /^[\p{L}\p{N}\s.,!?;:'"“”«»()\-–—/#%+*]+$/u;

export const ORDER_COMMENT_PATTERN =
  /^[\p{L}\p{N}\s.,!?;:'"“”«»()\-–—/#%+*]*$/u;

export const PAYMENT_PURPOSE_PATTERN =
  /^[\p{L}\p{N}\s.,!?;:'"“”«»()\-–—/#%+*]+$/u;

export const PICTURE_DATA_URL_PATTERN =
  /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export const TAX_ID_PATTERN = /^\d{8,10}$/;
export const IBAN_PATTERN = /^UA\d{27}$/;

export const WORKING_HOURS_PATTERN = /^[\p{L}\p{N}\s.,:;–—'’/#()\-]+$/u;

export const TEXT_EDITOR_PATTERN =
  /^[\p{L}\p{N}\s.,!?;:'"“”«»()\-–—/#%+*\n\r]+$/u;
