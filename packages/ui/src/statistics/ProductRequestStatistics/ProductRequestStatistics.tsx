import Link from 'next/link';
import clsx from 'clsx';
import type { CSSProperties } from 'react';

import {
  CheckCircle2,
  Clock3,
  FileClock,
  FilePlus2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { PRODUCT_REQUEST_STATUS_LABELS } from '@e-pharmacy/config/product-requests';

import {
  type ProductRequestStatisticsCounts,
  type ProductRequestStatus,
} from '@e-pharmacy/types/product-requests';

import css from './ProductRequestStatistics.module.css';

//===================================================================

type ProductRequestStatisticTone = 'blue' | 'yellow' | 'green' | 'red' | 'gray';

//===================================================================

type ProductRequestStatisticConfig = Readonly<{
  status: ProductRequestStatus;
  tone: ProductRequestStatisticTone;
  icon: LucideIcon;
}>;

type ProductRequestStatisticsProps = Readonly<{
  counts: ProductRequestStatisticsCounts;
  className?: string;
  showDraft?: boolean;
  getStatusHref?: (status: ProductRequestStatus) => string | undefined;
}>;

//===================================================================

type ProductRequestStatisticsStyle = CSSProperties & {
  '--product-request-stat-columns'?: string;
  '--product-request-stat-tablet-columns'?: string;
};

//===================================================================

const PRODUCT_REQUEST_STATISTICS_CONFIG: ProductRequestStatisticConfig[] = [
  { status: 'draft', tone: 'gray', icon: FileClock },
  { status: 'new', tone: 'blue', icon: FilePlus2 },
  { status: 'in_progress', tone: 'yellow', icon: Clock3 },
  { status: 'approved', tone: 'green', icon: CheckCircle2 },
  { status: 'rejected', tone: 'red', icon: XCircle },
];

//===================================================================

function ProductRequestStatisticCard({
  status,
  value,
  tone,
  icon: Icon,
  href,
}: Readonly<{
  status: ProductRequestStatus;
  value: number;
  tone: ProductRequestStatisticTone;
  icon: LucideIcon;
  href?: string;
}>) {
  const content = (
    <>
      <div className={css.cardHeader}>
        <h3 className={css.cardTitle}>
          {PRODUCT_REQUEST_STATUS_LABELS[status]}
        </h3>
        <span className={css.iconWrap}>
          <Icon className={css.icon} size={26} aria-hidden="true" />
        </span>
      </div>
      <p className={css.cardValue}>{value}</p>
    </>
  );

  const className = clsx(css.card, css[tone]);

  if (href) {
    return (
      <Link className={className} href={href}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}

//===================================================================

function ProductRequestStatistics({
  counts,
  className,
  showDraft = true,
  getStatusHref,
}: ProductRequestStatisticsProps) {
  const cards = PRODUCT_REQUEST_STATISTICS_CONFIG.filter(
    (item) => showDraft || item.status !== 'draft'
  );

  const style: ProductRequestStatisticsStyle = {
    '--product-request-stat-columns': String(cards.length),
    '--product-request-stat-tablet-columns': showDraft ? '3' : '2',
  };

  return (
    <div
      className={clsx(css.grid, className)}
      style={style}
      aria-label="Product request statistics"
    >
      {cards.map((card) => (
        <ProductRequestStatisticCard
          key={card.status}
          status={card.status}
          value={counts[card.status] ?? 0}
          tone={card.tone}
          icon={card.icon}
          href={getStatusHref?.(card.status)}
        />
      ))}
    </div>
  );
}

export default ProductRequestStatistics;
export { ProductRequestStatistics };
export type { ProductRequestStatisticsProps };
