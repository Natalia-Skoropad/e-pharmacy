export type AllProductStatisticsKey =
  | 'active'
  | 'blocked'
  | 'addedToPharmacy'
  | 'notAddedToPharmacy';

//===================================================================

export type AllProductStatisticsCounts = Record<
  AllProductStatisticsKey,
  number
>;
