import {
  CheckCircle2,
  Clock3,
  FilePlus2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';

import {
  StatsCard,
  StatsGrid,
  type StatsCardTone,
} from '@e-pharmacy/ui/statistics';

import type { ProductRequestStatisticsCounts } from '@/lib/product-requests/product-requests';

import css from '../AllProductStatistics/AllProductStatistics.module.css';

//===================================================================

type ProductRequestStatisticConfig = Readonly<{
  status: ProductRequestStatus;
  tone: StatsCardTone;
  icon: LucideIcon;
}>;

type ProductRequestStatisticsProps = Readonly<{
  counts: ProductRequestStatisticsCounts;
  className?: string;
  activeStatuses?: readonly ProductRequestStatus[];
  getStatusHref?: (status: ProductRequestStatus) => string | undefined;
}>;

//===================================================================

const PRODUCT_REQUEST_STATISTICS_CONFIG: readonly ProductRequestStatisticConfig[] =
  [
    { status: 'new', tone: 'blue', icon: FilePlus2 },
    { status: 'on_moderation', tone: 'yellow', icon: Clock3 },
    { status: 'approved', tone: 'green', icon: CheckCircle2 },
    { status: 'rejected', tone: 'red', icon: XCircle },
  ];

//===================================================================

function ProductRequestStatistics({
  counts,
  className,
  activeStatuses = [],
  getStatusHref,
}: ProductRequestStatisticsProps) {
  const cards = PRODUCT_REQUEST_STATISTICS_CONFIG;

  return (
    <StatsGrid
      className={className}
      columns={cards.length}
      tabletColumns={2}
      ariaLabel="Product request statistics"
    >
      {cards.map(({ status, tone, icon: Icon }) => {
        const title = PRODUCT_REQUEST_STATUS_PRESENTATION[status].label;
        const active = activeStatuses.includes(status);

        return (
          <StatsCard
            key={status}
            title={title}
            value={counts[status] ?? 0}
            tone={tone}
            icon={<Icon size={26} aria-hidden="true" />}
            href={getStatusHref?.(status)}
            className={active ? css.activeCard : undefined}
            ariaLabel={
              active
                ? `Clear ${title.toLowerCase()} request filter`
                : `Filter requests by ${title.toLowerCase()}`
            }
          />
        );
      })}
    </StatsGrid>
  );
}

export default ProductRequestStatistics;
export { ProductRequestStatistics };
export type { ProductRequestStatisticsProps };
