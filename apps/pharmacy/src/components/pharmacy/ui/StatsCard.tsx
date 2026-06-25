import Link from 'next/link';
import clsx from 'clsx';

import { StatusBadge } from './StatusBadge';
import type { PharmacyStatusVariant } from './status-types';

import css from './StatsCard.module.css';

//===================================================================

type StatsCardContentProps = Readonly<{
  title: string;
  value: string | number;
  description?: string;
  status?: PharmacyStatusVariant;
  statusLabel?: string;
  meta?: string;
}>;

type StatsCardProps = StatsCardContentProps &
  Readonly<{
    href?: string;
    className?: string;
  }>;

//===================================================================

function StatsCardContent({
  title,
  value,
  description,
  status,
  statusLabel,
  meta,
}: StatsCardContentProps) {
  return (
    <>
      <div className={css.header}>
        <p className={css.title}>{title}</p>
        {status ? <StatusBadge status={status} label={statusLabel} /> : null}
      </div>
      <p className={css.value}>{value}</p>
      {description ? <p className={css.description}>{description}</p> : null}
      {meta ? <span className={css.meta}>{meta}</span> : null}
    </>
  );
}

//===================================================================

export function StatsCard({ href, className, ...contentProps }: StatsCardProps) {
  const classNames = clsx(css.card, href && css.clickable, className);

  if (href) {
    return (
      <Link className={classNames} href={href}>
        <StatsCardContent {...contentProps} />
      </Link>
    );
  }

  return (
    <article className={classNames}>
      <StatsCardContent {...contentProps} />
    </article>
  );
}
