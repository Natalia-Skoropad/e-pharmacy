import Link from 'next/link';
import type { CSSProperties } from 'react';

import {
  Archive,
  PackageX,
  ShoppingBag,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';

import clsx from 'clsx';

import {
  OWN_PRODUCT_STATISTICS_LABELS,
  type OwnProductStatisticsCounts,
  type OwnProductStatisticsKey,
  type OwnProductStatisticsValue,
} from '@e-pharmacy/types/products';

import { formatPrice } from '@e-pharmacy/utils/formatters';

import css from './OwnProductStatistics.module.css';

//===================================================================

type OwnProductStatisticTone = 'accent' | 'blue' | 'green' | 'gray' | 'yellow';

type OwnProductStatisticConfig = Readonly<{
  key: OwnProductStatisticsKey;
  tone: OwnProductStatisticTone;
  icon: LucideIcon;
}>;

type OwnProductStatisticsProps = Readonly<{
  counts: OwnProductStatisticsCounts;
  className?: string;
  visibleKeys?: readonly OwnProductStatisticsKey[];
  getStatisticHref?: (key: OwnProductStatisticsKey) => string | undefined;
}>;

type OwnProductStatisticsStyle = CSSProperties & {
  '--own-product-stat-columns'?: string;
  '--own-product-stat-tablet-columns'?: string;
};

//===================================================================

const OWN_PRODUCT_STATISTICS_CONFIG: OwnProductStatisticConfig[] = [
  { key: 'inStock', tone: 'accent', icon: Warehouse },
  { key: 'reserved', tone: 'yellow', icon: ShoppingBag },
  { key: 'available', tone: 'blue', icon: Archive },
  { key: 'outOfStock', tone: 'gray', icon: PackageX },
];

//===================================================================

function OwnProductStatisticCard({
  statisticKey,
  value,
  tone,
  icon: Icon,
  href,
}: Readonly<{
  statisticKey: OwnProductStatisticsKey;
  value: OwnProductStatisticsValue;
  tone: OwnProductStatisticTone;
  icon: LucideIcon;
  href?: string;
}>) {
  const content = (
    <>
      <div className={css.cardHeader}>
        <h3 className={css.cardTitle}>
          {OWN_PRODUCT_STATISTICS_LABELS[statisticKey]}
        </h3>
        <span className={css.iconWrap}>
          <Icon className={css.icon} size={26} aria-hidden="true" />
        </span>
      </div>
      <div className={css.cardValues}>
        <p className={css.cardValue}>{value.quantity}</p>
        {typeof value.amount === 'number' ? (
          <p className={css.cardAmount}>{formatPrice(value.amount)}</p>
        ) : null}
      </div>
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

function OwnProductStatistics({
  counts,
  className,
  visibleKeys,
  getStatisticHref,
}: OwnProductStatisticsProps) {
  const cards = visibleKeys?.length
    ? OWN_PRODUCT_STATISTICS_CONFIG.filter((card) =>
        visibleKeys.includes(card.key)
      )
    : OWN_PRODUCT_STATISTICS_CONFIG;

  const style: OwnProductStatisticsStyle = {
    '--own-product-stat-columns': String(cards.length),
    '--own-product-stat-tablet-columns': cards.length > 2 ? '2' : String(cards.length),
  };

  return (
    <div
      className={clsx(css.grid, className)}
      style={style}
      aria-label="Own product statistics"
    >
      {cards.map((card) => (
        <OwnProductStatisticCard
          key={card.key}
          statisticKey={card.key}
          value={counts[card.key] ?? { quantity: 0 }}
          tone={card.tone}
          icon={card.icon}
          href={getStatisticHref?.(card.key)}
        />
      ))}
    </div>
  );
}

export default OwnProductStatistics;
export { OwnProductStatistics };
export type { OwnProductStatisticsProps };
