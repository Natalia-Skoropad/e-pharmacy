export type OwnProductStatisticsKey =
  | 'inStock'
  | 'reserved'
  | 'available'
  | 'outOfStock';

//===================================================================

type OwnProductStatisticsValue = Readonly<{
  quantity: number;
  amount?: number;
}>;

export type OwnProductStatisticsCounts = Record<
  OwnProductStatisticsKey,
  OwnProductStatisticsValue
>;
