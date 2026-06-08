export const AVATAR_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AvatarAllowedType = (typeof AVATAR_ALLOWED_TYPES)[number];

export const AVATAR_ACCEPT = AVATAR_ALLOWED_TYPES.join(',');
