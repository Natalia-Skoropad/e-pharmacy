export const CLIENT_STATISTICS_LABELS = {
  total: 'Total clients',
  repeat: 'Repeat clients',
  active: 'Active clients',
  blocked: 'Blocked clients',
} as const;

//===================================================================

export type ClientStatisticsKey = keyof typeof CLIENT_STATISTICS_LABELS;

export type ClientStatisticsCounts = Readonly<
  Record<ClientStatisticsKey, number>
>;
