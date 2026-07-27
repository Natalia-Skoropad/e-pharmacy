export const CLIENT_SUCCESSFUL_ORDERS_FILTERS = [
  'repeat',
  'successful',
  'other',
] as const;

//===================================================================

export type ClientSuccessfulOrdersValue =
  (typeof CLIENT_SUCCESSFUL_ORDERS_FILTERS)[number];

//===================================================================

export const CLIENT_SUCCESSFUL_ORDERS_FILTER_LABELS = {
  repeat: 'Repeat clients',
  successful: 'Clients with successful orders',
  other: 'Other clients',
} as const satisfies Readonly<Record<ClientSuccessfulOrdersValue, string>>;
