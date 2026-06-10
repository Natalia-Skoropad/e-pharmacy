export const APP_NAMES = {
  client: 'E-PHARMACY',
  vendor: 'E-PHARMACY Vendor',
  admin: 'E-PHARMACY Admin',
} as const;

export type AppKey = keyof typeof APP_NAMES;
