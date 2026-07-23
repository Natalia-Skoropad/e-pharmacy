import {
  Ban,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

import { CLIENT_STATISTICS_LABELS } from '@e-pharmacy/config/clients';

import type {
  ClientStatisticsCounts,
  ClientStatisticsKey,
} from '@e-pharmacy/types/clients';

import {
  StatsCard,
  StatsGrid,
  type StatsCardTone,
} from '@e-pharmacy/ui/statistics';

//===================================================================

type ClientStatisticConfig = Readonly<{
  key: ClientStatisticsKey;
  tone: StatsCardTone;
  icon: LucideIcon;
}>;

type ClientStatisticsProps = Readonly<{
  counts: ClientStatisticsCounts;
  className?: string;
  getStatisticHref?: (key: ClientStatisticsKey) => string | undefined;
}>;

//===================================================================

const CLIENT_STATISTICS_CONFIG: readonly ClientStatisticConfig[] = [
  { key: 'total', tone: 'accent', icon: UsersRound },
  { key: 'repeat', tone: 'blue', icon: RefreshCw },
  { key: 'active', tone: 'green', icon: ShieldCheck },
  { key: 'blocked', tone: 'red', icon: Ban },
];

//===================================================================

function ClientStatistics({
  counts,
  className,
  getStatisticHref,
}: ClientStatisticsProps) {
  return (
    <StatsGrid
      className={className}
      columns={4}
      tabletColumns={2}
      ariaLabel="Client statistics"
    >
      {CLIENT_STATISTICS_CONFIG.map(({ key, tone, icon: Icon }) => {
        const title = CLIENT_STATISTICS_LABELS[key];

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

export default ClientStatistics;
export { ClientStatistics };
export type { ClientStatisticsProps };
