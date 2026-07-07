import Link from 'next/link';
import type { CSSProperties } from 'react';

import {
  Archive,
  Ban,
  Boxes,
  PackageCheck,
  PackageX,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';

import {
  OWN_PRODUCT_STATISTICS_LABELS,
  type OwnProductStatisticsCounts,
  type OwnProductStatisticsKey,
} from '@e-pharmacy/types/products';

import css from './OwnProductStatistics.module.css';

//===================================================================

type OwnProductStatisticTone =
  | 'accent'
  | 'blue'
  | 'green'
  | 'red'
  | 'gray'
  | 'yellow';

type OwnProductStatisticConfig = Readonly<{
  key: OwnProductStatisticsKey;
  tone: OwnProductStatisticTone;
  icon: LucideIcon;
}>;

type OwnProductStatisticsProps = Readonly<{
  counts: OwnProductStatisticsCounts;
  className?: string;
  getStatisticHref?: (key: OwnProductStatisticsKey) => string | undefined;
}>;

type OwnProductStatisticsStyle = CSSProperties & {
  '--own-product-stat-columns'?: string;
  '--own-product-stat-tablet-columns'?: string;
};

//===================================================================

const OWN_PRODUCT_STATISTICS_CONFIG: OwnProductStatisticConfig[] = [
  { key: 'total', tone: 'accent', icon: Boxes },
  { key: 'active', tone: 'green', icon: PackageCheck },
  { key: 'blocked', tone: 'red', icon: Ban },
  { key: 'inStock', tone: 'blue', icon: Archive },
  { key: 'outOfStock', tone: 'gray', icon: PackageX },
  { key: 'reserved', tone: 'yellow', icon: ShoppingBag },
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
  value: number;
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

function OwnProductStatistics({
  counts,
  className,
  getStatisticHref,
}: OwnProductStatisticsProps) {
  const style: OwnProductStatisticsStyle = {
    '--own-product-stat-columns': String(OWN_PRODUCT_STATISTICS_CONFIG.length),
    '--own-product-stat-tablet-columns': '3',
  };

  return (
    <div
      className={clsx(css.grid, className)}
      style={style}
      aria-label="Own product statistics"
    >
      {OWN_PRODUCT_STATISTICS_CONFIG.map((card) => (
        <OwnProductStatisticCard
          key={card.key}
          statisticKey={card.key}
          value={counts[card.key] ?? 0}
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
