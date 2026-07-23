import {
  CheckCircle2,
  Clock3,
  FileClock,
  FilePlus2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { PRODUCT_REQUEST_STATUS_LABELS } from '@e-pharmacy/config/product-requests';

import type {
  ProductRequestStatisticsCounts,
  ProductRequestStatus,
} from '@e-pharmacy/types/product-requests';

import {
  StatsCard,
  StatsGrid,
  type StatsCardTone,
} from '@e-pharmacy/ui/statistics';

//===================================================================

type ProductRequestStatisticConfig = Readonly<{
  status: ProductRequestStatus;
  tone: StatsCardTone;
  icon: LucideIcon;
}>;

type ProductRequestStatisticsProps = Readonly<{
  counts: ProductRequestStatisticsCounts;
  className?: string;
  showDraft?: boolean;
  getStatusHref?: (status: ProductRequestStatus) => string | undefined;
}>;

//===================================================================

const PRODUCT_REQUEST_STATISTICS_CONFIG: readonly ProductRequestStatisticConfig[] =
  [
    { status: 'draft', tone: 'gray', icon: FileClock },
    { status: 'new', tone: 'blue', icon: FilePlus2 },
    { status: 'in_progress', tone: 'yellow', icon: Clock3 },
    { status: 'approved', tone: 'green', icon: CheckCircle2 },
    { status: 'rejected', tone: 'red', icon: XCircle },
  ];

//===================================================================

function ProductRequestStatistics({
  counts,
  className,
  showDraft = true,
  getStatusHref,
}: ProductRequestStatisticsProps) {
  const cards = PRODUCT_REQUEST_STATISTICS_CONFIG.filter(
    ({ status }) => showDraft || status !== 'draft'
  );

  return (
    <StatsGrid
      className={className}
      columns={cards.length}
      tabletColumns={showDraft ? 3 : 2}
      ariaLabel="Product request statistics"
    >
      {cards.map(({ status, tone, icon: Icon }) => {
        const title = PRODUCT_REQUEST_STATUS_LABELS[status];

        return (
          <StatsCard
            key={status}
            title={title}
            value={counts[status] ?? 0}
            tone={tone}
            icon={<Icon size={26} aria-hidden="true" />}
            href={getStatusHref?.(status)}
            ariaLabel={`${title} statistics`}
          />
        );
      })}
    </StatsGrid>
  );
}

export default ProductRequestStatistics;
export { ProductRequestStatistics };
export type { ProductRequestStatisticsProps };
