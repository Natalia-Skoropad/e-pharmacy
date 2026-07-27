import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { ORDER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type {
  OrderStatisticsCounts,
  OrderStatus,
} from '@e-pharmacy/types/orders';

import {
  StatsCard,
  StatsGrid,
  type StatsCardTone,
} from '@e-pharmacy/ui/statistics';

import { formatMoney } from '@e-pharmacy/utils/money';

//===================================================================

type OrderStatisticConfig = Readonly<{
  key: OrderStatus;
  title: string;
  tone: StatsCardTone;
  icon: LucideIcon;
}>;

type OrderStatisticsProps = Readonly<{
  counts: OrderStatisticsCounts;
  className?: string;
  getStatusHref?: (status: OrderStatus) => string | undefined;
  onStatusClick?: (status: OrderStatus) => void;
}>;

//===================================================================

const ORDER_STATISTICS_CONFIG: readonly OrderStatisticConfig[] = [
  {
    key: 'new',
    title: `${ORDER_STATUS_PRESENTATION.new.label} orders`,
    tone: 'blue',
    icon: ClipboardList,
  },
  {
    key: 'in_progress',
    title: ORDER_STATUS_PRESENTATION.in_progress.label,
    tone: 'yellow',
    icon: Clock3,
  },
  {
    key: 'successful',
    title: ORDER_STATUS_PRESENTATION.successful.label,
    tone: 'green',
    icon: CheckCircle2,
  },
  {
    key: 'rejected',
    title: ORDER_STATUS_PRESENTATION.rejected.label,
    tone: 'red',
    icon: XCircle,
  },
];

//===================================================================

function OrderStatistics({
  counts,
  className,
  getStatusHref,
  onStatusClick,
}: OrderStatisticsProps) {
  return (
    <StatsGrid
      className={className}
      columns={4}
      tabletColumns={2}
      ariaLabel="Order statistics"
    >
      {ORDER_STATISTICS_CONFIG.map(({ key, title, tone, icon: Icon }) => {
        const value = counts[key] ?? { count: 0, amount: 0 };
        const href = getStatusHref?.(key);

        return (
          <StatsCard
            key={key}
            title={title}
            value={value.count}
            meta={formatMoney(value.amount) ?? '—'}
            tone={tone}
            icon={<Icon size={26} aria-hidden="true" />}
            href={href}
            onClick={
              href
                ? undefined
                : onStatusClick
                  ? () => onStatusClick(key)
                  : undefined
            }
            ariaLabel={`${title} statistics`}
          />
        );
      })}
    </StatsGrid>
  );
}

export default OrderStatistics;
export { OrderStatistics };
export type { OrderStatisticsProps };
