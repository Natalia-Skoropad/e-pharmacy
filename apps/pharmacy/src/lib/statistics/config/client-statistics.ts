export const CLIENT_STATISTICS_KEYS = [
  'total',
  'repeat',
  'active',
  'blocked',
] as const;

//===================================================================

export type ClientStatisticsKey = (typeof CLIENT_STATISTICS_KEYS)[number];

export type ClientStatisticsCounts = Readonly<
  Record<ClientStatisticsKey, number>
>;

//===================================================================

export const CLIENT_STATISTICS_LABELS = {
  total: 'Total clients',
  repeat: 'Repeat clients',
  active: 'Active clients',
  blocked: 'Blocked clients',
} as const satisfies Readonly<Record<ClientStatisticsKey, string>>;
