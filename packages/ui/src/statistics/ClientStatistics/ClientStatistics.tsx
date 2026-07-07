import Link from 'next/link';

import {
  Ban,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';

import {
  CLIENT_STATISTICS_LABELS,
  type ClientStatisticsCounts,
  type ClientStatisticsKey,
} from '@e-pharmacy/types/clients';

import css from './ClientStatistics.module.css';

//===================================================================

type ClientStatisticTone = 'accent' | 'blue' | 'green' | 'red';

type ClientStatisticConfig = Readonly<{
  key: ClientStatisticsKey;
  tone: ClientStatisticTone;
  icon: LucideIcon;
}>;

type ClientStatisticsProps = Readonly<{
  counts: ClientStatisticsCounts;
  className?: string;
  getStatisticHref?: (key: ClientStatisticsKey) => string | undefined;
}>;

//===================================================================

const CLIENT_STATISTICS_CONFIG: ClientStatisticConfig[] = [
  { key: 'total', tone: 'accent', icon: UsersRound },
  { key: 'repeat', tone: 'blue', icon: RefreshCw },
  { key: 'active', tone: 'green', icon: ShieldCheck },
  { key: 'blocked', tone: 'red', icon: Ban },
];

//===================================================================

function ClientStatisticCard({
  statisticKey,
  value,
  tone,
  icon: Icon,
  href,
}: Readonly<{
  statisticKey: ClientStatisticsKey;
  value: number;
  tone: ClientStatisticTone;
  icon: LucideIcon;
  href?: string;
}>) {
  const title = CLIENT_STATISTICS_LABELS[statisticKey];

  const content = (
    <>
      <div className={css.cardHeader}>
        <h3 className={css.cardTitle}>{title}</h3>
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
      <Link className={className} href={href} aria-label={`${title} statistics`}>
        {content}
      </Link>
    );
  }

  return (
    <article className={className} aria-label={`${title} statistics`}>
      {content}
    </article>
  );
}

//===================================================================

function ClientStatistics({
  counts,
  className,
  getStatisticHref,
}: ClientStatisticsProps) {
  return (
    <div className={clsx(css.grid, className)} aria-label="Client statistics">
      {CLIENT_STATISTICS_CONFIG.map((card) => (
        <ClientStatisticCard
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

export default ClientStatistics;
export { ClientStatistics };
export type { ClientStatisticsProps };
