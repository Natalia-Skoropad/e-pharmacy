export const CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES = [
  'repeat',
  'successful',
  'other',
] as const;

//===================================================================

export type ClientSuccessfulOrdersFilter =
  (typeof CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES)[number];

//===================================================================

export const CLIENT_SUCCESSFUL_ORDER_FILTER_LABELS = {
  repeat: 'Repeat clients',
  successful: 'Clients with successful orders',
  other: 'Other clients',
} as const satisfies Readonly<Record<ClientSuccessfulOrdersFilter, string>>;
