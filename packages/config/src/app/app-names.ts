export const APP_NAMES = {
  client: 'E-PHARMACY',
  pharmacy: 'E-PHARMACY Pharmacy',
  admin: 'E-PHARMACY Admin',
} as const;

export type AppKey = keyof typeof APP_NAMES;
