import Link from 'next/link';

import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import clsx from 'clsx';

import type { OrderStatus } from '@e-pharmacy/types/orders';
import type { OrderStatisticsCounts } from '@e-pharmacy/types/orders';
import { formatMoney } from '@e-pharmacy/utils/money';

import css from './OrderStatistics.module.css';

//===================================================================

type OrderStatisticTone = 'blue' | 'yellow' | 'green' | 'red';

//===================================================================

type OrderStatisticConfig = Readonly<{
  key: OrderStatus;
  title: string;
  tone: OrderStatisticTone;
  icon: LucideIcon;
}>;

type OrderStatisticsProps = Readonly<{
  counts: OrderStatisticsCounts;
  className?: string;
  getStatusHref?: (status: OrderStatus) => string | undefined;
  onStatusClick?: (status: OrderStatus) => void;
}>;

//===================================================================

const ORDER_STATISTICS_CONFIG: OrderStatisticConfig[] = [
  { key: 'new', title: 'New orders', tone: 'blue', icon: ClipboardList },
  { key: 'in_progress', title: 'In progress', tone: 'yellow', icon: Clock3 },
  { key: 'successful', title: 'Successful', tone: 'green', icon: CheckCircle2 },
  { key: 'rejected', title: 'Rejected', tone: 'red', icon: XCircle },
];

//===================================================================

function OrderStatisticCard({
  status,
  title,
  count,
  amount,
  tone,
  icon: Icon,
  href,
  onClick,
}: Readonly<{
  status: OrderStatus;
  title: string;
  count: number;
  amount: number;
  tone: OrderStatisticTone;
  icon: LucideIcon;
  href?: string;
  onClick?: (status: OrderStatus) => void;
}>) {
  const content = (
    <>
      <div className={css.cardHeader}>
        <h3 className={css.cardTitle}>{title}</h3>
        <span className={css.iconWrap}>
          <Icon className={css.icon} size={26} aria-hidden="true" />
        </span>
      </div>
      <div className={css.cardValues}>
        <p className={css.cardValue}>{count}</p>
        <p className={css.cardAmount}>{formatMoney(amount) ?? '—'}</p>
      </div>
    </>
  );

  const className = clsx(css.card, css[tone], onClick && css.cardButton);

  if (href) {
    return (
      <Link
        className={className}
        href={href}
        aria-label={`${title} statistics`}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        className={className}
        type="button"
        aria-label={`${title} statistics`}
        onClick={() => onClick(status)}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={className} aria-label={`${title} statistics`}>
      {content}
    </article>
  );
}

//===================================================================

function OrderStatistics({
  counts,
  className,
  getStatusHref,
  onStatusClick,
}: OrderStatisticsProps) {
  return (
    <div className={clsx(css.grid, className)} aria-label="Order statistics">
      {ORDER_STATISTICS_CONFIG.map((card) => {
        const value = counts[card.key] ?? { count: 0, amount: 0 };

        return (
          <OrderStatisticCard
            key={card.key}
            status={card.key}
            title={card.title}
            count={value.count}
            amount={value.amount}
            tone={card.tone}
            icon={card.icon}
            href={getStatusHref?.(card.key)}
            onClick={onStatusClick}
          />
        );
      })}
    </div>
  );
}

export default OrderStatistics;
export { OrderStatistics };
export type { OrderStatisticsProps };
