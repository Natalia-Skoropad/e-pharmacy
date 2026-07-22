import Link from 'next/link';
import clsx from 'clsx';

import {
  Ban,
  CirclePlus,
  PackageCheck,
  PackageX,
  type LucideIcon,
} from 'lucide-react';

import { ALL_PRODUCT_STATISTICS_LABELS } from '@e-pharmacy/config/products';

import {
  type AllProductStatisticsCounts,
  type AllProductStatisticsKey,
} from '@e-pharmacy/types/products';

import css from './AllProductStatistics.module.css';

//===================================================================

type AllProductStatisticTone = 'green' | 'red' | 'success' | 'yellow';

//===================================================================

type AllProductStatisticConfig = Readonly<{
  key: AllProductStatisticsKey;
  tone: AllProductStatisticTone;
  icon: LucideIcon;
}>;

type AllProductStatisticsProps = Readonly<{
  counts: AllProductStatisticsCounts;
  className?: string;
  getStatisticHref?: (key: AllProductStatisticsKey) => string | undefined;
}>;

//===================================================================

const ALL_PRODUCT_STATISTICS_CONFIG: AllProductStatisticConfig[] = [
  { key: 'active', tone: 'green', icon: PackageCheck },
  { key: 'blocked', tone: 'red', icon: Ban },
  { key: 'addedToPharmacy', tone: 'success', icon: CirclePlus },
  { key: 'notAddedToPharmacy', tone: 'yellow', icon: PackageX },
];

//===================================================================

function AllProductStatisticCard({
  statisticKey,
  value,
  tone,
  icon: Icon,
  href,
}: Readonly<{
  statisticKey: AllProductStatisticsKey;
  value: number;
  tone: AllProductStatisticTone;
  icon: LucideIcon;
  href?: string;
}>) {
  const content = (
    <>
      <div className={css.cardHeader}>
        <h3 className={css.cardTitle}>
          {ALL_PRODUCT_STATISTICS_LABELS[statisticKey]}
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

function AllProductStatistics({
  counts,
  className,
  getStatisticHref,
}: AllProductStatisticsProps) {
  return (
    <div
      className={clsx(css.grid, className)}
      aria-label="All product statistics"
    >
      {ALL_PRODUCT_STATISTICS_CONFIG.map((card) => (
        <AllProductStatisticCard
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

export default AllProductStatistics;
export { AllProductStatistics };
export type { AllProductStatisticsProps };
