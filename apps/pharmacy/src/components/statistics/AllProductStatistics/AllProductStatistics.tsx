import {
  Ban,
  CirclePlus,
  PackageCheck,
  PackageX,
  type LucideIcon,
} from 'lucide-react';

import { ALL_PRODUCT_STATISTICS_LABELS } from '@e-pharmacy/config/products';

import type {
  AllProductStatisticsCounts,
  AllProductStatisticsKey,
} from '@e-pharmacy/types/products';

import {
  StatsCard,
  StatsGrid,
  type StatsCardTone,
} from '@e-pharmacy/ui/statistics';

//===================================================================

type AllProductStatisticConfig = Readonly<{
  key: AllProductStatisticsKey;
  tone: StatsCardTone;
  icon: LucideIcon;
}>;

type AllProductStatisticsProps = Readonly<{
  counts: AllProductStatisticsCounts;
  className?: string;
  getStatisticHref?: (key: AllProductStatisticsKey) => string | undefined;
}>;

//===================================================================

const ALL_PRODUCT_STATISTICS_CONFIG: readonly AllProductStatisticConfig[] = [
  { key: 'active', tone: 'green', icon: PackageCheck },
  { key: 'blocked', tone: 'red', icon: Ban },
  { key: 'addedToPharmacy', tone: 'success', icon: CirclePlus },
  { key: 'notAddedToPharmacy', tone: 'yellow', icon: PackageX },
];

//===================================================================

function AllProductStatistics({
  counts,
  className,
  getStatisticHref,
}: AllProductStatisticsProps) {
  return (
    <StatsGrid
      className={className}
      columns={4}
      tabletColumns={2}
      ariaLabel="All product statistics"
    >
      {ALL_PRODUCT_STATISTICS_CONFIG.map(({ key, tone, icon: Icon }) => {
        const title = ALL_PRODUCT_STATISTICS_LABELS[key];

        return (
          <StatsCard
            key={key}
            title={title}
            value={counts[key] ?? 0}
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

export default AllProductStatistics;
export { AllProductStatistics };
export type { AllProductStatisticsProps };
