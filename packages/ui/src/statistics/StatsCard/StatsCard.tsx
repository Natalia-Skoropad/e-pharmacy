import Link from 'next/link';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import { StatusBadge, type StatusTone } from '../StatusBadge/StatusBadge';

import css from './StatsCard.module.css';

//===================================================================

export type StatsCardTone =
  | 'neutral'
  | 'accent'
  | 'blue'
  | 'green'
  | 'success'
  | 'yellow'
  | 'red'
  | 'gray';

//===================================================================

export type StatsCardProps = Readonly<{
  title: string;
  value: string | number;
  description?: string;
  status?: Readonly<{ label: string; tone: StatusTone }>;
  meta?: string;
  icon?: ReactNode;
  tone?: StatsCardTone;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}>;

//===================================================================

function StatsCardContent({
  title,
  value,
  description,
  status,
  meta,
  icon,
}: Pick<
  StatsCardProps,
  'title' | 'value' | 'description' | 'status' | 'meta' | 'icon'
>) {
  return (
    <>
      <div className={css.header}>
        <p className={css.title}>{title}</p>
        {icon ? <span className={css.icon}>{icon}</span> : null}
        {!icon && status ? <StatusBadge {...status} /> : null}
      </div>
      <p className={css.value}>{value}</p>
      {description ? <p className={css.description}>{description}</p> : null}
      {meta ? <span className={css.meta}>{meta}</span> : null}
    </>
  );
}

export function StatsCard({
  href,
  onClick,
  ariaLabel,
  className,
  tone = 'neutral',
  ...contentProps
}: StatsCardProps) {
  const isInteractive = Boolean(href || onClick);
  const classNames = clsx(
    css.card,
    css[tone],
    isInteractive && css.clickable,
    className
  );

  if (href) {
    return (
      <Link className={classNames} href={href} aria-label={ariaLabel}>
        <StatsCardContent {...contentProps} />
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        className={classNames}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        <StatsCardContent {...contentProps} />
      </button>
    );
  }

  return (
    <article className={classNames} aria-label={ariaLabel}>
      <StatsCardContent {...contentProps} />
    </article>
  );
}
