import {
  Ban,
  CirclePlus,
  PackageCheck,
  PackageX,
  type LucideIcon,
} from 'lucide-react';

import type {
  AllProductStatisticsCounts,
  AllProductStatisticsKey,
} from '@e-pharmacy/types/products';

import {
  StatsCard,
  StatsGrid,
  type StatsCardTone,
} from '@e-pharmacy/ui/statistics';

import { ALL_PRODUCT_STATISTICS_LABELS } from '@/lib/statistics/config';

import css from './AllProductStatistics.module.css';

//===================================================================

type AllProductStatisticConfig = Readonly<{
  key: AllProductStatisticsKey;
  tone: StatsCardTone;
  icon: LucideIcon;
}>;

type AllProductStatisticsProps = Readonly<{
  counts: AllProductStatisticsCounts;
  className?: string;
  activeKeys?: readonly AllProductStatisticsKey[];
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
  activeKeys = [],
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
        const active = activeKeys.includes(key);

        return (
          <StatsCard
            key={key}
            title={title}
            value={counts[key] ?? 0}
            tone={tone}
            icon={<Icon size={26} aria-hidden="true" />}
            href={getStatisticHref?.(key)}
            className={active ? css.activeCard : undefined}
            ariaLabel={
              active
                ? `Clear ${title.toLowerCase()} product filter`
                : `Filter products by ${title.toLowerCase()}`
            }
          />
        );
      })}
    </StatsGrid>
  );
}

export default AllProductStatistics;
export { AllProductStatistics };
export type { AllProductStatisticsProps };
