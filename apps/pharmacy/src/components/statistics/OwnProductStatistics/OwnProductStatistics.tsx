import {
  Archive,
  PackageX,
  ShoppingBag,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';

import { OWN_PRODUCT_STATISTICS_LABELS } from '@e-pharmacy/config/products';

import type {
  OwnProductStatisticsCounts,
  OwnProductStatisticsKey,
} from '@e-pharmacy/types/products';

import {
  StatsCard,
  StatsGrid,
  type StatsCardTone,
} from '@e-pharmacy/ui/statistics';

import { formatMoney } from '@e-pharmacy/utils/money';

//===================================================================

type OwnProductStatisticConfig = Readonly<{
  key: OwnProductStatisticsKey;
  tone: StatsCardTone;
  icon: LucideIcon;
}>;

type OwnProductStatisticsProps = Readonly<{
  counts: OwnProductStatisticsCounts;
  className?: string;
  visibleKeys?: readonly OwnProductStatisticsKey[];
  getStatisticHref?: (key: OwnProductStatisticsKey) => string | undefined;
}>;

//===================================================================

const OWN_PRODUCT_STATISTICS_CONFIG: readonly OwnProductStatisticConfig[] = [
  { key: 'inStock', tone: 'accent', icon: Warehouse },
  { key: 'reserved', tone: 'yellow', icon: ShoppingBag },
  { key: 'available', tone: 'blue', icon: Archive },
  { key: 'outOfStock', tone: 'gray', icon: PackageX },
];

//===================================================================

function OwnProductStatistics({
  counts,
  className,
  visibleKeys,
  getStatisticHref,
}: OwnProductStatisticsProps) {
  const cards = visibleKeys?.length
    ? OWN_PRODUCT_STATISTICS_CONFIG.filter(({ key }) =>
        visibleKeys.includes(key)
      )
    : OWN_PRODUCT_STATISTICS_CONFIG;

  return (
    <StatsGrid
      className={className}
      columns={cards.length}
      tabletColumns={cards.length > 2 ? 2 : cards.length}
      ariaLabel="Own product statistics"
    >
      {cards.map(({ key, tone, icon: Icon }) => {
        const title = OWN_PRODUCT_STATISTICS_LABELS[key];
        const value = counts[key] ?? { quantity: 0 };

        return (
          <StatsCard
            key={key}
            title={title}
            value={value.quantity}
            meta={
              typeof value.amount === 'number'
                ? (formatMoney(value.amount) ?? '—')
                : undefined
            }
            tone={tone}
            icon={<Icon size={26} aria-hidden="true" />}
            href={getStatisticHref?.(key)}
            ariaLabel={`${title} statistics`}
          />
        );
      })}
    </StatsGrid>
  );
}

export default OwnProductStatistics;
export { OwnProductStatistics };
export type { OwnProductStatisticsProps };
